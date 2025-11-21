import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { searchApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Search as SearchIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDuration } from '@/lib/utils'

export default function Search() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchType, setSearchType] = useState<'keyword' | 'semantic'>('keyword')
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(10)

  const searchMutation = useMutation({
    mutationFn: (params: { query: string; topK: number }) =>
      searchType === 'keyword'
        ? searchApi.keyword(params.query, undefined, params.topK)
        : searchApi.semantic(params.query, params.topK),
    onError: (error: Error) => {
      toast({
        title: 'Search failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      toast({
        title: 'Invalid query',
        description: 'Please enter a search query.',
        variant: 'destructive',
      })
      return
    }
    searchMutation.mutate({ query: query.trim(), topK })
  }

  const handleResultClick = (callId: string, start: number) => {
    navigate(`/calls/${callId}?timestamp=${start}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground">Search across call transcripts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Configuration</CardTitle>
          <CardDescription>Choose search type and enter your query</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label htmlFor="searchType">Search Type</Label>
              <Select value={searchType} onValueChange={(v) => setSearchType(v as 'keyword' | 'semantic')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Keyword Search</SelectItem>
                  <SelectItem value="semantic">Semantic Search</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="query">Search Query</Label>
              <div className="flex gap-2">
                <Input
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchType === 'keyword' ? 'Enter keywords...' : 'Enter natural language query...'}
                />
                <Button type="submit" disabled={searchMutation.isPending}>
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="topK">Results Limit</Label>
              <Input
                id="topK"
                type="number"
                min="1"
                max="100"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {searchMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchMutation.data.length} result{searchMutation.data.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchMutation.data.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Text</TableHead>
                      <TableHead>Speaker</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchMutation.data.map((result) => (
                      <TableRow
                        key={`${result.call_id}-${result.segment_id}`}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleResultClick(result.call_id, result.start)}
                      >
                        <TableCell className="max-w-md">
                          <p className="truncate">{result.text}</p>
                        </TableCell>
                        <TableCell>
                          {result.speaker && <Badge variant="outline">{result.speaker}</Badge>}
                        </TableCell>
                        <TableCell>
                          {formatDuration(result.start)}
                        </TableCell>
                        <TableCell>
                          {formatDuration(result.duration)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {searchType === 'semantic' ? result.score.toFixed(3) : '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No results found</p>
            )}
          </CardContent>
        </Card>
      )}

      {searchMutation.isPending && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Searching...
          </CardContent>
        </Card>
      )}
    </div>
  )
}

