import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportAllData, getStorageStats, importAllData } from '@/db'
import { formatBytes } from '@/lib/utils'
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Database,
  Download,
  FolderSync,
  HardDrive,
  ImageIcon,
  Loader2,
  Package,
  RefreshCw,
  Settings as SettingsIcon,
  Upload,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface StorageStats {
  totalItems: number
  itemsWithImages: number
  totalImageSize: number
  metadataSize: number
  totalEstimatedSize: number
  averageImageSize: number
}

interface ExportSettings {
  autoExportEnabled: boolean
  autoExportInterval: string // 'daily', 'weekly', 'monthly'
  lastExportDate: string | null
  exportFolderHandle: FileSystemDirectoryHandle | null
  exportFolderName: string | null
}

const STORAGE_KEY = 'nomad-wardrobe-export-settings'

export default function Settings() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    autoExportEnabled: false,
    autoExportInterval: 'weekly',
    lastExportDate: null,
    exportFolderHandle: null,
    exportFolderName: null,
  })
  const [folderSupported, setFolderSupported] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadStorageStats()
    loadExportSettings()
    // Check if File System Access API is supported
    setFolderSupported('showDirectoryPicker' in window)
  }, [])

  // Auto-export check on mount and interval
  useEffect(() => {
    if (exportSettings.autoExportEnabled && exportSettings.exportFolderHandle) {
      checkAndRunAutoExport()

      // Check every hour while app is open
      const interval = setInterval(checkAndRunAutoExport, 60 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [exportSettings.autoExportEnabled, exportSettings.exportFolderHandle, exportSettings.autoExportInterval])

  const loadStorageStats = async () => {
    const stats = await getStorageStats()
    setStorageStats(stats)
  }

  const loadExportSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setExportSettings(prev => ({
          ...prev,
          autoExportEnabled: parsed.autoExportEnabled || false,
          autoExportInterval: parsed.autoExportInterval || 'weekly',
          lastExportDate: parsed.lastExportDate || null,
          exportFolderName: parsed.exportFolderName || null,
          // Note: FileSystemDirectoryHandle can't be serialized, need to re-select folder
        }))
      }
    } catch (e) {
      console.error('Failed to load export settings:', e)
    }
  }

  const saveExportSettings = (settings: Partial<ExportSettings>) => {
    const newSettings = { ...exportSettings, ...settings }
    setExportSettings(newSettings)

    // Save to localStorage (excluding handle which can't be serialized)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      autoExportEnabled: newSettings.autoExportEnabled,
      autoExportInterval: newSettings.autoExportInterval,
      lastExportDate: newSettings.lastExportDate,
      exportFolderName: newSettings.exportFolderName,
    }))
  }

  const checkAndRunAutoExport = useCallback(async () => {
    if (!exportSettings.lastExportDate || !exportSettings.exportFolderHandle) return

    const lastExport = new Date(exportSettings.lastExportDate)
    const now = new Date()
    const daysSinceExport = Math.floor((now.getTime() - lastExport.getTime()) / (1000 * 60 * 60 * 24))

    let shouldExport = false
    switch (exportSettings.autoExportInterval) {
      case 'daily':
        shouldExport = daysSinceExport >= 1
        break
      case 'weekly':
        shouldExport = daysSinceExport >= 7
        break
      case 'monthly':
        shouldExport = daysSinceExport >= 30
        break
    }

    if (shouldExport) {
      await handleQuickExport()
    }
  }, [exportSettings])

  const handleExport = async () => {
    setExporting(true)
    setExportResult(null)
    try {
      const data = await exportAllData()

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wardrobe-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      saveExportSettings({ lastExportDate: new Date().toISOString() })
      setExportResult({ success: true, message: 'Backup downloaded successfully!' })
    } catch (error) {
      console.error('Export failed:', error)
      setExportResult({ success: false, message: 'Export failed. Please try again.' })
    } finally {
      setExporting(false)
    }
  }

  const handleSelectFolder = async () => {
    try {
      // @ts-ignore - File System Access API
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
      })
      saveExportSettings({
        exportFolderHandle: handle,
        exportFolderName: handle.name,
      })
      setExportSettings(prev => ({ ...prev, exportFolderHandle: handle }))
      setExportResult({ success: true, message: `Folder "${handle.name}" selected for exports` })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setExportResult({ success: false, message: 'Failed to select folder' })
      }
    }
  }

  const handleQuickExport = async () => {
    if (!exportSettings.exportFolderHandle) {
      setExportResult({ success: false, message: 'Please select a folder first' })
      return
    }

    setExporting(true)
    setExportResult(null)
    try {
      const data = await exportAllData()
      const fileName = `wardrobe-backup-${new Date().toISOString().split('T')[0]}.json`

      // Create file in selected folder
      const fileHandle = await exportSettings.exportFolderHandle.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(data, null, 2))
      await writable.close()

      saveExportSettings({ lastExportDate: new Date().toISOString() })
      setExportResult({ success: true, message: `Exported to ${exportSettings.exportFolderName}/${fileName}` })
      loadStorageStats()
    } catch (e) {
      console.error('Quick export failed:', e)
      // Permission might have been revoked, clear the handle
      if ((e as Error).name === 'NotAllowedError') {
        saveExportSettings({ exportFolderHandle: null, exportFolderName: null })
        setExportResult({ success: false, message: 'Folder permission expired. Please select folder again.' })
      } else {
        setExportResult({ success: false, message: 'Export failed. Please try again.' })
      }
    } finally {
      setExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const results = await importAllData(data)

      setImportResult({
        success: true,
        message: `Successfully imported: ${results.items} items, ${results.trips} trips, ${results.outfits} outfits`,
      })
      loadStorageStats()
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Failed to parse import file. Make sure it\'s a valid JSON backup.',
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getNextExportDate = () => {
    if (!exportSettings.lastExportDate) return 'Not scheduled'

    const last = new Date(exportSettings.lastExportDate)
    let next = new Date(last)

    switch (exportSettings.autoExportInterval) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
    }

    return next.toLocaleDateString()
  }

  // Estimate capacity (conservative: 500MB usable for this app)
  const estimatedCapacity = 500 * 1024 * 1024 // 500 MB
  const usagePercentage = storageStats ? (storageStats.totalEstimatedSize / estimatedCapacity) * 100 : 0
  const estimatedItemsCapacity = storageStats && storageStats.averageImageSize > 0
    ? Math.floor(estimatedCapacity / (storageStats.averageImageSize + 1024))
    : 5000

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your app settings and data</p>
      </div>

      {/* Quick Export Section */}
      {folderSupported && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderSync className="h-5 w-5 text-primary" />
              Quick Export to Folder
            </CardTitle>
            <CardDescription>
              Select a folder (e.g., Google Drive, Dropbox, or any synced folder) for one-click exports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderSync className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Export Folder</p>
                    <p className="text-sm text-muted-foreground">
                      {exportSettings.exportFolderName || 'No folder selected'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSelectFolder}>
                    {exportSettings.exportFolderName ? 'Change Folder' : 'Select Folder'}
                  </Button>
                  {exportSettings.exportFolderName && (
                    <Button onClick={handleQuickExport} disabled={exporting}>
                      {exporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export Now
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Auto-Export Schedule</p>
                    <p className="text-sm text-muted-foreground">
                      {exportSettings.autoExportEnabled ? `Next: ${getNextExportDate()}` : 'Disabled'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={exportSettings.autoExportInterval}
                    onValueChange={(value) => saveExportSettings({ autoExportInterval: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant={exportSettings.autoExportEnabled ? "default" : "outline"}
                    onClick={() => saveExportSettings({
                      autoExportEnabled: !exportSettings.autoExportEnabled,
                      lastExportDate: exportSettings.autoExportEnabled ? exportSettings.lastExportDate : new Date().toISOString()
                    })}
                    disabled={!exportSettings.exportFolderName}
                  >
                    {exportSettings.autoExportEnabled ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Enable
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {exportSettings.lastExportDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Last export: {new Date(exportSettings.lastExportDate).toLocaleString()}
              </div>
            )}

            {exportResult && (
              <div className={`p-3 rounded-lg flex items-start gap-2 ${exportResult.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                {exportResult.success ? <Check className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
                <p className="text-sm">{exportResult.message}</p>
              </div>
            )}

            <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-blue-500">Tip:</strong> Select your Google Drive, Dropbox, or iCloud folder to automatically sync backups to the cloud. The auto-export will run when the app is open.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Export and import your wardrobe data for backup or migration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-muted-foreground">
                    Download as JSON file
                  </p>
                </div>
              </div>
              <Button onClick={handleExport} disabled={exporting} className="w-full">
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Backup
                  </>
                )}
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Import Data</p>
                  <p className="text-sm text-muted-foreground">
                    Restore from backup file
                  </p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
              <Button onClick={handleImportClick} variant="outline" disabled={importing} className="w-full">
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Backup
                  </>
                )}
              </Button>
            </div>
          </div>

          {importResult && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${importResult.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
              {importResult.success ? <Check className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
              <p className="text-sm">{importResult.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Information
          </CardTitle>
          <CardDescription>Your data is stored locally in your browser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storageStats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-sm">Total Items</span>
                    </div>
                    <p className="text-2xl font-bold">{storageStats.totalItems}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-sm">With Images</span>
                    </div>
                    <p className="text-2xl font-bold">{storageStats.itemsWithImages}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <HardDrive className="h-4 w-4" />
                      <span className="text-sm">Image Storage</span>
                    </div>
                    <p className="text-2xl font-bold">{formatBytes(storageStats.totalImageSize)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Database className="h-4 w-4" />
                      <span className="text-sm">Avg/Image</span>
                    </div>
                    <p className="text-2xl font-bold">{formatBytes(storageStats.averageImageSize)}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Storage Used</span>
                    <span className="text-sm font-medium">
                      {formatBytes(storageStats.totalEstimatedSize)} / ~500 MB
                    </span>
                  </div>
                  <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
                </div>

                <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
                  <p className="font-medium text-blue-500 mb-1">Capacity Estimate</p>
                  <p className="text-sm text-muted-foreground">
                    Based on your average image size of {formatBytes(storageStats.averageImageSize)},
                    you can store approximately <strong className="text-foreground">{estimatedItemsCapacity.toLocaleString()}</strong> items
                    with images before reaching browser limits.
                  </p>
                </div>
              </>
            )}

            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Storage Type</p>
                  <p className="text-sm text-muted-foreground font-mono">IndexedDB (Browser Local Storage)</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-600">Backup Reminder</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your data is stored locally in your browser. If you clear your browser data, you'll lose everything.
                    Set up auto-export above to keep your data safe!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Nomad Wardrobe</strong> - Personal wardrobe and accessories management for the nomadic lifestyle.
            </p>
            <p>Version 2.2.0 (React + Vite + Auto-Export)</p>
            <p>Built with React, Vite, IndexedDB (Dexie.js), and Tailwind CSS. All your data stays in your browser.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
