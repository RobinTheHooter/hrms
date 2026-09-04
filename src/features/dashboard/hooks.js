import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { HttpClient } from '@/lib/httpClient'

async function getSummary(days, signal) {
  return HttpClient('/dashboard/summary', { params: { days } }, signal)
}

export function useDashboardSummary(days = 7) {
  return useQuery({
    queryKey: ['dashboard', 'summary', days],
    queryFn: ({ signal }) => getSummary(days, signal),
    placeholderData: keepPreviousData,
  })
}

async function getConsultantBreakdown(signal) {
  return HttpClient('/dashboard/consultants', {}, signal)
}

export function useConsultantBreakdown(enabled) {
  return useQuery({
    queryKey: ['dashboard', 'consultants'],
    queryFn: ({ signal }) => getConsultantBreakdown(signal),
    enabled: Boolean(enabled),
  })
}

async function getRecentDecisions(limit, signal) {
  return HttpClient('/dashboard/recent-decisions', { params: { limit } }, signal)
}

export function useRecentDecisions(limit = 12) {
  return useQuery({
    queryKey: ['dashboard', 'recent-decisions', limit],
    queryFn: ({ signal }) => getRecentDecisions(limit, signal),
    placeholderData: keepPreviousData,
  })
}

async function getRecruitingAnalytics(signal) {
  return HttpClient('/dashboard/analytics/recruiting', {}, signal)
}

export function useRecruitingAnalytics() {
  return useQuery({
    queryKey: ['dashboard', 'analytics', 'recruiting'],
    queryFn: ({ signal }) => getRecruitingAnalytics(signal),
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

async function getAttrition(months, signal) {
  return HttpClient('/dashboard/analytics/attrition', { params: { months } }, signal)
}

export function useAttrition(months = 12) {
  return useQuery({
    queryKey: ['dashboard', 'analytics', 'attrition', months],
    queryFn: ({ signal }) => getAttrition(months, signal),
    placeholderData: keepPreviousData,
  })
}
