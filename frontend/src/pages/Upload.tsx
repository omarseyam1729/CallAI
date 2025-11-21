import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { uploadApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Upload as UploadIcon, FileAudio, X } from 'lucide-react'

export default function Upload() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadApi.upload(file),
    onSuccess: (data) => {
      toast({
        title: 'Upload successful',
        description: 'Call uploaded and processed successfully.',
      })
      navigate(`/calls/${data.id}`)
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type.startsWith('audio/') || 
          ['.mp3', '.wav', '.m4a', '.ogg'].some(ext => droppedFile.name.toLowerCase().endsWith(ext))) {
        setFile(droppedFile)
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an audio file.',
          variant: 'destructive',
        })
      }
    }
  }, [toast])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Call</h1>
        <p className="text-muted-foreground">Upload an audio file to analyze</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Audio File</CardTitle>
          <CardDescription>
            Supported formats: MP3, WAV, M4A, OGG
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25'
            }`}
          >
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <FileAudio className="h-12 w-12 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="w-full"
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload & Process'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    Drag and drop your audio file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    or click to browse
                  </p>
                </div>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" type="button" asChild>
                    <span>Select File</span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

