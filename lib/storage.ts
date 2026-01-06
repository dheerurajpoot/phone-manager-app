import * as SecureStore from 'expo-secure-store';

const KEY_ROLE = 'app_role';
const KEY_CHILD_ID = 'child_id';
const KEY_CHILD_NAME = 'child_name';

export async function saveRole(role: 'parent' | 'child') {
  await SecureStore.setItemAsync(KEY_ROLE, role);
}

export async function getRole(): Promise<'parent' | 'child' | null> {
  const v = await SecureStore.getItemAsync(KEY_ROLE);
  return (v as any) || null;
}

export async function saveChildIdentity(id: string, name: string) {
  await SecureStore.setItemAsync(KEY_CHILD_ID, id);
  await SecureStore.setItemAsync(KEY_CHILD_NAME, name);
}

export async function getChildIdentity(): Promise<{ id: string | null; name: string | null }> {
  const id = await SecureStore.getItemAsync(KEY_CHILD_ID);
  const name = await SecureStore.getItemAsync(KEY_CHILD_NAME);
  return { id, name };
}

export async function clearIdentity() {
  await SecureStore.deleteItemAsync(KEY_CHILD_ID);
  await SecureStore.deleteItemAsync(KEY_CHILD_NAME);
  await SecureStore.deleteItemAsync(KEY_ROLE);
}
