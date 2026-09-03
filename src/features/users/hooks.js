import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  bulkDeleteUsers,
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '@/features/users/api'

const USERS_KEY = ['users']

function invalidateUserViews(qc) {
  qc.invalidateQueries({ queryKey: ['users'] })
  qc.invalidateQueries({ queryKey: ['consultants'] })
  qc.invalidateQueries({ queryKey: ['dashboard'] })
}

export function useUsers(params) {
  return useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => invalidateUserViews(qc),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: () => invalidateUserViews(qc),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => invalidateUserViews(qc),
  })
}

export function useBulkDeleteUsers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bulkDeleteUsers,
    onSuccess: () => invalidateUserViews(qc),
  })
}
