import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { callsApi, agentsApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Eye, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CallExplorer() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [perPage] = useState(25)
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState<string>('')

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.list(),
  })

  const { data: callsData, isLoading } = useQuery({
    queryKey: ['calls', { page, per_page: perPage, order, q: searchQuery, agent_id: agentFilter || undefined }],
    queryFn: () => callsApi.list({
      page,
      per_page: perPage,
      order,
      q: searchQuery || undefined,
      agent_id: agentFilter ? parseInt(agentFilter) : undefined,
    }),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Explorer</h1>
          <p className="text-muted-foreground">Browse and manage your call recordings</p>
        </div>
        <Link to="/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Call
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <Input
            placeholder="Search calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <Select value={agentFilter || 'all'} onValueChange={(v) => setAgentFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents?.map((agent) => (
              <SelectItem key={agent.id} value={agent.id.toString()}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={order} onValueChange={(v) => setOrder(v as 'asc' | 'desc')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callsData?.items && callsData.items.length > 0 ? (
                  callsData.items.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">
                        {call.call_name || `Call ${call.id.slice(0, 8)}`}
                      </TableCell>
                      <TableCell>
                        {call.agent_name ? (
                          <Badge variant="secondary">{call.agent_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {call.duration_sec > 0 ? (
                          <span>{Math.round(call.duration_sec)}s</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(call.upload_time)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/calls/${call.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No calls found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {callsData && callsData.page_count > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, callsData.total)} of {callsData.total} calls
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(callsData.page_count, p + 1))}
                  disabled={page === callsData.page_count}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

