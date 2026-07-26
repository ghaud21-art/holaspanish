async function j(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `요청 실패 (${res.status})`);
  return body;
}

export const api = {
  status: () => fetch('/api/status').then(j),
  getProfile: (userId) => fetch(`/api/profile?userId=${encodeURIComponent(userId)}`).then(j),
  saveProfile: (userId, patch) =>
    fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, patch }),
    }).then(j),

  getGroups: (userId) => fetch(`/api/groups?userId=${encodeURIComponent(userId)}`).then(j),
  createGroup: (userId, name) =>
    fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', userId, name }),
    }).then(j),
  joinGroup: (userId, inviteCode) =>
    fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', userId, inviteCode }),
    }).then(j),

  getGroupMembers: (groupId) => fetch(`/api/group-members?groupId=${encodeURIComponent(groupId)}`).then(j),
  cheerMember: (groupId, userId) =>
    fetch('/api/group-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cheer', groupId, userId }),
    }).then(j),

  getPosts: (groupId) => fetch(`/api/posts?groupId=${encodeURIComponent(groupId)}`).then(j),
  createPost: (payload) =>
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...payload }),
    }).then(j),
  reactPost: (postId, emoji) =>
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'react', postId, emoji }),
    }).then(j),
  commentPost: (postId, userId, nickname, text) =>
    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comment', postId, userId, nickname, text }),
    }).then(j),
};
