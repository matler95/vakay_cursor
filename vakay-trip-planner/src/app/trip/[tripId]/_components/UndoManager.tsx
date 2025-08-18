'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, X, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionHistoryItem {
  id: string;
  action: string;
  timestamp: Date;
  undoFn: () => void;
  data?: unknown;
}

interface UndoManagerProps {
  className?: string;
  children?: React.ReactNode;
}

// Create context for undo manager
interface UndoContextType {
  addAction: (action: string, undoFn: () => void, data?: unknown) => void;
  undoLastAction: () => void;
  clearHistory: () => void;
}

const UndoContext = createContext<UndoContextType | null>(null);

export function UndoManager({ className, children }: UndoManagerProps) {
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionHistoryItem | null>(null);

  // Add action to history
  const addAction = useCallback((action: string, undoFn: () => void, data?: unknown) => {
    const newAction: ActionHistoryItem = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      timestamp: new Date(),
      undoFn,
      data
    };

    setActionHistory(prev => [newAction, ...prev.slice(0, 9)]); // Keep last 10 actions
    setCurrentAction(newAction);
    setShowUndoSnackbar(true);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowUndoSnackbar(false);
      setCurrentAction(null);
    }, 5000);
  }, []);

  // Undo last action
  const undoLastAction = useCallback(() => {
    if (actionHistory.length === 0) return;

    const lastAction = actionHistory[0];
    
    try {
      lastAction.undoFn();
      
      // Remove from history
      setActionHistory(prev => prev.slice(1));
      
      // Hide snackbar
      setShowUndoSnackbar(false);
      setCurrentAction(null);
      
      // Show success feedback
      addAction(`Undid: ${lastAction.action}`, () => {
        // Re-apply the action
        if (lastAction.data) {
          // This would need to be implemented based on the specific action type
          console.log('Re-applying action:', lastAction);
        }
      });
      
    } catch (error) {
      console.error('Failed to undo action:', error);
      // Could show error toast here
    }
  }, [actionHistory, addAction]);

  // Clear action history
  const clearHistory = useCallback(() => {
    setActionHistory([]);
  }, []);

  // Format action description for display
  const formatActionDescription = (action: string) => {
    if (action.includes('assigned')) {
      return action;
    }
    if (action.includes('transfer')) {
      return action;
    }
    if (action.includes('notes')) {
      return action;
    }
    if (action.includes('Undid:')) {
      return action;
    }
    return action;
  };

  // Get time ago string
  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  // Provide context value
  const contextValue: UndoContextType = {
    addAction,
    undoLastAction,
    clearHistory
  };

  return (
    <UndoContext.Provider value={contextValue}>
      {/* Render children first */}
      {children}
      
      {/* Undo Snackbar */}
      {showUndoSnackbar && currentAction && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-md mx-4">
            <Undo2 className="h-5 w-5 text-blue-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {formatActionDescription(currentAction.action)}
              </p>
              <p className="text-xs text-gray-300">
                {getTimeAgo(currentAction.timestamp)}
              </p>
            </div>
            <Button
              onClick={undoLastAction}
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-blue-400 hover:text-white hover:bg-blue-600"
            >
              Undo
            </Button>
            <Button
              onClick={() => setShowUndoSnackbar(false)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Action History Panel (optional, for debugging) */}
      {actionHistory.length > 0 && (
        <div className={cn("fixed top-4 right-4 z-40", className)}>
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Recent Actions</h4>
              <Button
                onClick={clearHistory}
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </Button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {actionHistory.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-2 rounded bg-gray-50 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {formatActionDescription(action.action)}
                    </p>
                    <p className="text-gray-500">
                      {getTimeAgo(action.timestamp)}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      try {
                        action.undoFn();
                        setActionHistory(prev => prev.filter(a => a.id !== action.id));
                      } catch (error) {
                        console.error('Failed to undo action:', error);
                      }
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Undo
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </UndoContext.Provider>
  );
}

// Hook for using undo manager in other components
export function useUndoManager() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndoManager must be used within an UndoManager component');
  }
  return context;
}
