import React from 'react';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader } from './ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats Overview Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Capsules List Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              {/* Media Thumbnail Skeleton */}
              <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
              
              {/* Content Skeleton */}
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              
              {/* Actions Skeleton */}
              <div className="hidden sm:flex gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Compact skeleton for mobile
export function DashboardSkeletonMobile() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-7 w-12 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Capsules List */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-14 h-14 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
