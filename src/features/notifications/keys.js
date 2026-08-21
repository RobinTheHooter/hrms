// TanStack query keys for the notifications feed.
export const notificationKeys = {
  all: ['notifications'],
  list: () => [...notificationKeys.all, 'list'],
}
