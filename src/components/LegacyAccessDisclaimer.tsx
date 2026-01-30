import React, { useState } from 'react';
import { AlertTriangle, Info, Scale, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';

export function LegacyAccessDisclaimer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Alert className="border border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/10">
      <AlertDescription>
        <div className="space-y-2">
          {/* Collapsed View - Always Visible */}
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Legacy Access is not a legal will.</strong> It's a convenience feature for digital access.
              {!isExpanded && (
                <span className="text-xs ml-1 opacity-75">
                  Consult an attorney for estate planning.
                </span>
              )}
            </div>
          </div>
          
          {/* Centered Button */}
          <div className="flex justify-center pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-3 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
            >
              {isExpanded ? (
                <>
                  Less <ChevronUp className="w-3 h-3 ml-1" />
                </>
              ) : (
                <>
                  Legal Details <ChevronDown className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </div>
          
          {/* Expanded View - Show Details */}
          {isExpanded && (
            <div className="pt-3 border-t border-amber-300 dark:border-amber-700 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <div className="text-xs text-amber-800 dark:text-amber-200 space-y-2">
                <p className="flex items-start gap-2">
                  <Shield className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    For formal estate planning, please consult with a qualified attorney or estate planner 
                    in your jurisdiction.
                  </span>
                </p>
                
                <p className="flex items-start gap-2">
                  <Scale className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    Data inheritance laws vary by country and state. Eras is not responsible for legal 
                    disputes regarding digital asset inheritance.
                  </span>
                </p>
                
                <p className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    Beneficiary access may be subject to local laws, terms of service, and content restrictions.
                  </span>
                </p>
              </div>
              
              <div className="pt-2 border-t border-amber-300/50 dark:border-amber-700/50">
                <p className="text-xs text-amber-700 dark:text-amber-300 italic">
                  By enabling Legacy Access, you acknowledge that you understand this is a convenience 
                  feature and not a replacement for proper legal estate planning.
                </p>
              </div>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
