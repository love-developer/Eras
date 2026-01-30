import React from 'react';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader } from './ui/card';

export function AIEditorSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with tabs */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
      </Card>

      {/* Media Preview Area */}
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="w-full aspect-video rounded-lg" />
        </CardContent>
      </Card>

      {/* Filter Grid */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="border rounded-lg p-3 space-y-2"
              >
                <Skeleton className="w-full aspect-square rounded-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Skeleton className="h-11 w-32" />
        <Skeleton className="h-11 w-32" />
      </div>
    </div>
  );
}

// Mobile compact version
export function AIEditorSkeletonMobile() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>

      {/* Preview */}
      <Skeleton className="w-full aspect-video rounded-lg" />

      {/* Quick Filters */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="w-full aspect-square rounded-md" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
