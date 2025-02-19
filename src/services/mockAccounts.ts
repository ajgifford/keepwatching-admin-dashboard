// Mock Data Generator and API Functions

const updateAccountName = async (accountId: number, newName: string) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (newName.trim().length < 1) {
    throw new Error('Name cannot be empty');
  }

  return Promise.resolve();
};

const updateProfileName = async (profileId: number, newName: string) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (newName.trim().length < 1) {
    throw new Error('Name cannot be empty');
  }

  return Promise.resolve();
};

const deleteProfile = async (profileId: number) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Check if profile exists
  const profileFound = false;

  if (!profileFound) {
    throw new Error('Profile not found');
  }

  return Promise.resolve();
};

const deleteAccount = async (accountId: number) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const accountExists = true;
  if (!accountExists) {
    throw new Error('Account not found');
  }

  return Promise.resolve();
};

export { updateAccountName, updateProfileName, deleteProfile, deleteAccount };
