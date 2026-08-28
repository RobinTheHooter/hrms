import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/apiClient'

async function getSummary(days) {
  const { data } = await apiClient.get('/dashboard/summary', { params: { days } })
  return data
}

export function useDashboardSummary(days = 7) {
  return useQuery({
    queryKey: ['dashboard', 'summary', days],
    queryFn: () => getSummary(days),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  })
}

async function getConsultantBreakdown() {
  const { data } = await apiClient.get('/dashboard/consultants')
  return data
}

export function useConsultantBreakdown(enabled) {
  return useQuery({
    queryKey: ['dashboard', 'consultants'],
    queryFn: getConsultantBreakdown,
    enabled: Boolean(enabled),
  })
}

async function getRecruitingAnalytics() {
  const { data } = await apiClient.get('/dashboard/analytics/recruiting')
  return data
}

export function useRecruitingAnalytics() {
  return useQuery({
    queryKey: ['dashboard', 'analytics', 'recruiting'],
    queryFn: getRecruitingAnalytics,
    placeholderData: keepPreviousData,
  })
}

async function getAttrition(months) {
  const { data } = await apiClient.get('/dashboard/analytics/attrition', {
    params: { months },
  })
  return data
}

export function useAttrition(months = 12) {
  return useQuery({
    queryKey: ['dashboard', 'analytics', 'attrition', months],
    queryFn: () => getAttrition(months),
    placeholderData: keepPreviousData,
  })
}
