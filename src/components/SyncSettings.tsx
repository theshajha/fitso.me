/**
 * Sync Settings Component
 * Provides UI for cloud sync configuration and status
 */

import { useState } from 'react';
import { useSync } from '@/hooks/useSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    AlertTriangle,
    Check,
    Cloud,
    CloudOff,
    ImageIcon,
    Loader2,
    LogOut,
    Mail,
    RefreshCw,
    Shield,
    Wifi,
    WifiOff,
} from 'lucide-react';

export function SyncSettings() {
    const [state, actions] = useSync();
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Handle magic link request
    const handleSendMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        setEmailError(null);

        const result = await actions.sendMagicLink(email.trim());
        
        if (result.success) {
            setEmailSent(true);
        } else {
            setEmailError(result.message);
        }
        
        setIsLoading(false);
    };

    // Handle logout
    const handleLogout = async () => {
        setIsLoading(true);
        await actions.logout();
        setEmail('');
        setEmailSent(false);
        setIsLoading(false);
    };

    // Handle manual sync
    const handleSyncNow = async () => {
        await actions.syncNow();
    };

    // If sync API is not configured
    if (!state.isConfigured) {
        return (
            <Card className="border-dashed">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CloudOff className="h-4 w-4 text-muted-foreground" />
                        Cloud Sync
                    </CardTitle>
                    <CardDescription>
                        Cloud sync is not configured for this deployment
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Your data is stored locally in your browser. Export regularly to keep backups.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Not authenticated - show login form
    if (!state.isAuthenticated) {
        return (
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Cloud Sync
                    </CardTitle>
                    <CardDescription>
                        Sign in to sync your data across devices
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {emailSent ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <Mail className="h-5 w-5 text-emerald-500" />
                                <div>
                                    <p className="font-medium text-emerald-600">Check your email!</p>
                                    <p className="text-sm text-muted-foreground">
                                        We sent a magic link to <strong>{email}</strong>
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={() => { setEmailSent(false); setEmail(''); }}
                                className="w-full"
                            >
                                Use a different email
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSendMagicLink} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sync-email">Email address</Label>
                                <Input
                                    id="sync-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            {emailError && (
                                <div className="flex items-center gap-2 text-sm text-red-500">
                                    <AlertTriangle className="h-4 w-4" />
                                    {emailError}
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Magic Link
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                We'll send you a secure link to sign in. No password needed!
                            </p>
                        </form>
                    )}

                    <div className="pt-4 border-t space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            End-to-end encrypted sync
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ImageIcon className="h-3 w-3" />
                            Images synced securely
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Authenticated - show sync status and controls
    const imageSyncPercent = state.imageStats 
        ? Math.round((state.imageStats.synced / Math.max(state.imageStats.total, 1)) * 100)
        : 0;

    return (
        <Card className={state.syncEnabled ? 'border-primary/30' : ''}>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    {state.syncEnabled ? (
                        <Cloud className="h-4 w-4 text-primary" />
                    ) : (
                        <CloudOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    Cloud Sync
                    {state.isSyncing && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full animate-pulse">
                            Syncing...
                        </span>
                    )}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                    Signed in as <strong>{state.email}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Sync Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                        {state.syncEnabled ? (
                            <Wifi className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <WifiOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">
                            {state.syncEnabled ? 'Sync enabled' : 'Sync disabled'}
                        </span>
                    </div>
                    <Button
                        variant={state.syncEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => state.syncEnabled ? actions.disableSync() : actions.enableSync()}
                        disabled={state.isSyncing}
                    >
                        {state.syncEnabled ? 'Disable' : 'Enable'}
                    </Button>
                </div>

                {/* Sync Progress */}
                {state.isSyncing && state.syncProgress && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            {state.syncProgress}
                        </div>
                        <Progress value={50} className="h-1" />
                    </div>
                )}

                {/* Sync Status */}
                {state.syncEnabled && !state.isSyncing && (
                    <div className="space-y-3">
                        {/* Last Sync */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last synced</span>
                            <span className="font-medium">
                                {state.lastSyncAt 
                                    ? new Date(state.lastSyncAt).toLocaleString()
                                    : 'Never'
                                }
                            </span>
                        </div>

                        {/* Pending Changes */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pending changes</span>
                            <span className={`font-medium ${state.pendingChanges > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {state.pendingChanges > 0 ? (
                                    <>{state.pendingChanges} changes</>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <Check className="h-3 w-3" />
                                        Up to date
                                    </span>
                                )}
                            </span>
                        </div>

                        {/* Image Sync Status */}
                        {state.imageStats && state.imageStats.total > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <ImageIcon className="h-3 w-3" />
                                        Images synced
                                    </span>
                                    <span className="font-medium">
                                        {state.imageStats.synced}/{state.imageStats.total}
                                    </span>
                                </div>
                                <Progress value={imageSyncPercent} className="h-1" />
                                {state.imageStats.errors > 0 && (
                                    <p className="text-xs text-amber-500">
                                        {state.imageStats.errors} image(s) failed to sync
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Sync Now Button */}
                        <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={handleSyncNow}
                            disabled={state.isSyncing}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${state.isSyncing ? 'animate-spin' : ''}`} />
                            Sync Now
                        </Button>
                    </div>
                )}

                {/* Last Error */}
                {state.lastError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-red-600">Sync error</p>
                            <p className="text-muted-foreground">{state.lastError}</p>
                        </div>
                    </div>
                )}

                {/* Logout */}
                <div className="pt-3 border-t">
                    <Button 
                        variant="ghost" 
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={handleLogout}
                        disabled={isLoading || state.isSyncing}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

