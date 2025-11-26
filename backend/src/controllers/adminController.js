const { db, auth } = require('../config/firebase');

/**
 * Remove/Delete a user
 * FR 7.1: Remove User
 */
const removeUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Delete user from Firebase Auth
    await auth.deleteUser(userId);

    // Delete user document from Firestore
    await db.collection('users').doc(userId).delete();

    // Delete user's chats
    const chatsSnapshot = await db.collection('chats')
      .where('participants', 'array-contains', userId)
      .get();

    const batch = db.batch();
    chatsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete user's sessions
    const sessionsSnapshot = await db.collection('sessions')
      .where('proposerId', '==', userId)
      .get();

    const batch2 = db.batch();
    sessionsSnapshot.forEach(doc => {
      batch2.delete(doc.ref);
    });
    await batch2.commit();

    // Log admin action
    await db.collection('adminLogs').add({
      adminId: req.user.uid,
      action: 'remove_user',
      targetUserId: userId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'User removed successfully'
    });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing user'
    });
  }
};

/**
 * Review reports
 * FR 7.2: Review Reports
 */
const getReports = async (req, res) => {
  try {
    const { status } = req.query; // 'pending', 'resolved', 'dismissed'

    let query = db.collection('reports').orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    const reports = [];

    for (const doc of snapshot.docs) {
      const reportData = doc.data();

      // Get reporter info
      const reporterDoc = await db.collection('users').doc(reportData.reporterId).get();
      const reporterData = reporterDoc.exists ? reporterDoc.data() : null;

      // Get reported user info
      const reportedUserDoc = await db.collection('users').doc(reportData.reportedUserId).get();
      const reportedUserData = reportedUserDoc.exists ? reportedUserDoc.data() : null;

      reports.push({
        reportId: doc.id,
        ...reportData,
        createdAt: reportData.createdAt.toDate(),
        reporter: reporterData ? {
          uid: reportData.reporterId,
          displayName: reporterData.displayName,
          email: reporterData.email
        } : null,
        reportedUser: reportedUserData ? {
          uid: reportData.reportedUserId,
          displayName: reportedUserData.displayName,
          email: reportedUserData.email
        } : null
      });
    }

    res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
};

/**
 * Resolve a report
 */
const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, notes } = req.body; // action: 'resolve', 'dismiss'

    const reportRef = db.collection('reports').doc(reportId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const newStatus = action === 'resolve' ? 'resolved' : 'dismissed';

    await reportRef.update({
      status: newStatus,
      resolvedAt: new Date(),
      resolvedBy: req.user.uid,
      resolutionNotes: notes || ''
    });

    // Log admin action
    await db.collection('adminLogs').add({
      adminId: req.user.uid,
      action: `resolve_report_${newStatus}`,
      reportId: reportId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: `Report ${newStatus} successfully`
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving report'
    });
  }
};

/**
 * Moderate content - delete inappropriate skill listings or reviews
 * FR 7.3: Moderate Content
 */
const moderateContent = async (req, res) => {
  try {
    const { type, contentId, userId } = req.body; // type: 'skill', 'review'

    if (!type || !contentId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Type, content ID, and user ID are required'
      });
    }

    if (type === 'skill') {
      // Remove skill from user's profile
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userData = userDoc.data();
      const skillsToTeach = (userData.skillsToTeach || []).filter(
        s => s.skillName !== contentId
      );
      const skillsToLearn = (userData.skillsToLearn || []).filter(
        s => s.skillName !== contentId
      );

      await db.collection('users').doc(userId).update({
        skillsToTeach,
        skillsToLearn,
        updatedAt: new Date()
      });
    } else if (type === 'review') {
      // Delete review
      await db.collection('ratings').doc(contentId).delete();

      // Recalculate user rating
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const ratingsSnapshot = await db.collection('ratings')
          .where('ratedUserId', '==', userId)
          .get();

        let totalRating = 0;
        let count = 0;

        ratingsSnapshot.forEach(doc => {
          totalRating += doc.data().rating;
          count++;
        });

        const averageRating = count > 0 ? totalRating / count : 0;

        await db.collection('users').doc(userId).update({
          rating: Math.round(averageRating * 10) / 10,
          totalRatings: count,
          updatedAt: new Date()
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type'
      });
    }

    // Log admin action
    await db.collection('adminLogs').add({
      adminId: req.user.uid,
      action: 'moderate_content',
      contentType: type,
      contentId: contentId,
      targetUserId: userId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Content moderated successfully'
    });
  } catch (error) {
    console.error('Moderate content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error moderating content'
    });
  }
};

/**
 * Get admin logs
 * NFR 5: Auditability
 */
const getAdminLogs = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const snapshot = await db.collection('adminLogs')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const logs = [];
    snapshot.forEach(doc => {
      logs.push({
        logId: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin logs'
    });
  }
};

/**
 * Get all users (admin view)
 */
const getAllUsersAdmin = async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();

    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate()
      });
    });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Get all users admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

module.exports = {
  removeUser,
  getReports,
  resolveReport,
  moderateContent,
  getAdminLogs,
  getAllUsersAdmin
};

