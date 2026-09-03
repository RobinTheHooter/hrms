import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { HttpClient } from '@/lib/httpClient'

async function getSummary(days) {
  return HttpClient('/dashboard/summary', { params: { days } })
}

export function useDashboardSummary(days = 7) {
  return useQuery({
    queryKey: ['dashboard', 'summary', days],
    queryFn: () => getSummary(days),
    placeholderData: keepPreviousData,
  })
}

async function getConsultantBreakdown() {
  return HttpClient('/dashboard/consultants')
}

export function useConsultantBreakdown(enabled) {
  return useQuery({
    queryKey: ['dashboard', 'consultants'],
    queryFn: getConsultantBreakdown,
    enabled: Boolean(enabled),
  })
}

async function getRecentDecisions(limit) {
  return HttpClient('/dashboard/recent-decisions', { params: { limit } })
}

export function useRecentDecisions(limit = 12) {
  return useQuery({
    queryKey: ['dashboard', 'recent-decisions', limit],
    queryFn: () => getRecentDecisions(limit),
    placeholderData: keepPreviousData,
  })
}

async function getRecruitingAnalytics() {
  return HttpClient('/dashboard/analytics/recruiting')
}

export function useRecruitingAnalytics() {
  return useQuery({
    queryKey: ['dashboard', 'analytics', 'recruiting'],
    queryFn: getRecruitingAnalytics,
    placeholderData: keepPreviousData,
  })
}

export async function downloadMisReport() {
  const res = await HttpClient('/dashboard/mis-report', { responseType: 'blob' })
  const cd = res.headers['content-disposition'] || ''
  const match = cd.match(/filename="?([^"]+)"?/)
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = match ? match[1] : 'mis-report.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function getAttrition(months) {
  return HttpClient('/dashboard/analytics/attrition', { params: { months } })
}

export function useAttrition(months = 12) {
  return useQuery({
    queryKey: ['dashboard', 'analytics', 'attrition', months],
    queryFn: () => getAttrition(months),
    placeholderData: keepPreviousData,
  })
}
