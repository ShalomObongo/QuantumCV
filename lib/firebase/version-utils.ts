import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { ResumeVersion, ResumeData, ATSScore } from '@/types';

/**
 * Create a new version of a resume
 */
export async function createVersion(params: {
  documentId: string;
  userId: string;
  versionName: string;
  data: ResumeData;
  atsScore?: ATSScore;
}): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');

  const { documentId, userId, versionName, data, atsScore } = params;

  // Get existing versions to determine version number
  const versionsRef = collection(db, 'resume_versions');
  const versionsQuery = query(
    versionsRef,
    where('documentId', '==', documentId),
    orderBy('versionNumber', 'desc')
  );
  const versionsSnapshot = await getDocs(versionsQuery);

  const latestVersionNumber = versionsSnapshot.empty
    ? 0
    : (versionsSnapshot.docs[0].data().versionNumber || 0);

  const newVersionNumber = latestVersionNumber + 1;

  // Create version document
  const versionDoc = await addDoc(versionsRef, {
    documentId,
    userId,
    versionNumber: newVersionNumber,
    versionName,
    data,
    atsScore: atsScore || null,
    createdAt: Timestamp.now(),
  });

  return versionDoc.id;
}

/**
 * Get all versions for a document
 */
export async function getVersions(documentId: string): Promise<ResumeVersion[]> {
  if (!db) throw new Error('Firestore not initialized');

  const versionsRef = collection(db, 'resume_versions');
  const versionsQuery = query(
    versionsRef,
    where('documentId', '==', documentId),
    orderBy('versionNumber', 'desc')
  );

  const snapshot = await getDocs(versionsQuery);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      documentId: data.documentId,
      versionNumber: data.versionNumber,
      versionName: data.versionName,
      data: data.data,
      atsScore: data.atsScore || undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}

/**
 * Get a specific version by ID
 */
export async function getVersion(versionId: string): Promise<ResumeVersion | null> {
  if (!db) throw new Error('Firestore not initialized');

  const versionRef = doc(db, 'resume_versions', versionId);
  const versionSnap = await getDoc(versionRef);

  if (!versionSnap.exists()) {
    return null;
  }

  const data = versionSnap.data();
  return {
    id: versionSnap.id,
    documentId: data.documentId,
    versionNumber: data.versionNumber,
    versionName: data.versionName,
    data: data.data,
    atsScore: data.atsScore || undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

/**
 * Delete a version
 */
export async function deleteVersion(versionId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const versionRef = doc(db, 'resume_versions', versionId);
  await deleteDoc(versionRef);
}

/**
 * Update a version's name
 */
export async function updateVersionName(
  versionId: string,
  newName: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const versionRef = doc(db, 'resume_versions', versionId);
  await updateDoc(versionRef, {
    versionName: newName,
  });
}

/**
 * Restore a version (create new document from version)
 */
export async function restoreVersion(
  versionId: string,
  userId: string
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');

  const version = await getVersion(versionId);
  if (!version) {
    throw new Error('Version not found');
  }

  // Create a new document from the version data
  const documentsRef = collection(db, 'documents');
  const newDoc = await addDoc(documentsRef, {
    userId,
    type: 'resume',
    variant: 'general',
    data: version.data,
    fileName: `resume_restored_${Date.now()}.pdf`,
    createdAt: Timestamp.now(),
    restoredFrom: versionId,
    atsScore: version.atsScore || null,
  });

  return newDoc.id;
}

/**
 * Compare two versions and return differences
 */
export function compareVersions(
  version1: ResumeVersion,
  version2: ResumeVersion
): {
  category: string;
  field: string;
  version1Value: any;
  version2Value: any;
  isDifferent: boolean;
}[] {
  const differences: {
    category: string;
    field: string;
    version1Value: any;
    version2Value: any;
    isDifferent: boolean;
  }[] = [];

  // Compare contact info
  Object.keys(version1.data.contactInfo).forEach((key) => {
    const v1Val = (version1.data.contactInfo as any)[key];
    const v2Val = (version2.data.contactInfo as any)[key];
    if (JSON.stringify(v1Val) !== JSON.stringify(v2Val)) {
      differences.push({
        category: 'Contact Info',
        field: key,
        version1Value: v1Val,
        version2Value: v2Val,
        isDifferent: true,
      });
    }
  });

  // Compare summary
  if (version1.data.summary !== version2.data.summary) {
    differences.push({
      category: 'Summary',
      field: 'summary',
      version1Value: version1.data.summary,
      version2Value: version2.data.summary,
      isDifferent: true,
    });
  }

  // Compare experience
  const experienceDiff =
    JSON.stringify(version1.data.experience) !==
    JSON.stringify(version2.data.experience);
  if (experienceDiff) {
    differences.push({
      category: 'Experience',
      field: 'experience',
      version1Value: version1.data.experience,
      version2Value: version2.data.experience,
      isDifferent: true,
    });
  }

  // Compare education
  const educationDiff =
    JSON.stringify(version1.data.education) !==
    JSON.stringify(version2.data.education);
  if (educationDiff) {
    differences.push({
      category: 'Education',
      field: 'education',
      version1Value: version1.data.education,
      version2Value: version2.data.education,
      isDifferent: true,
    });
  }

  // Compare skills
  const skillsDiff =
    JSON.stringify(version1.data.skills) !== JSON.stringify(version2.data.skills);
  if (skillsDiff) {
    differences.push({
      category: 'Skills',
      field: 'skills',
      version1Value: version1.data.skills,
      version2Value: version2.data.skills,
      isDifferent: true,
    });
  }

  // Compare ATS scores
  if (version1.atsScore && version2.atsScore) {
    if (version1.atsScore.overall !== version2.atsScore.overall) {
      differences.push({
        category: 'ATS Score',
        field: 'overall',
        version1Value: version1.atsScore.overall,
        version2Value: version2.atsScore.overall,
        isDifferent: true,
      });
    }
  }

  return differences;
}
