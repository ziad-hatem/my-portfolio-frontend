"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings } from "lucide-react";
import { Analytics } from "../../utils/analytics";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = Analytics.getConsent();
    if (consent === null) {
      // Show banner after a short delay
      setTimeout(() => {
        setIsVisible(true);
      }, 1000);
    }
  }, []);

  const handleAccept = () => {
    Analytics.setConsent(true);
    setIsVisible(false);
  };

  const handleReject = () => {
    Analytics.setConsent(false);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Cookie Consent Banner */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50"
          >
            <div className="bg-card border-2 border-accent/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-accent/10 via-accent/5 to-transparent p-6 pb-4">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <Cookie className="text-accent" size={24} />
                  </div>
                  <div>
                    <h3 className="text-foreground mb-1">Cookie Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      We use analytics to improve your experience
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  We use local storage to track which projects and posts you're
                  interested in. This helps me understand what content resonates
                  with visitors. No personal data is collected or shared with
                  third parties.
                </p>

                {/* Details Toggle */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors mb-4"
                >
                  <Settings size={16} />
                  <span>{showDetails ? "Hide" : "Show"} details</span>
                </button>

                {/* Details */}
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-muted/30 rounded-lg p-4 mb-4 space-y-3">
                        <div>
                          <h4 className="text-sm text-foreground mb-1">
                            What we track:
                          </h4>
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Project and post page views</li>
                            <li>Click interactions on cards</li>
                            <li>Share button usage</li>
                            <li>Timestamps of interactions</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm text-foreground mb-1">
                            What we don't track:
                          </h4>
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Personal information</li>
                            <li>IP addresses</li>
                            <li>Cross-site activity</li>
                            <li>Any identifiable data</li>
                          </ul>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          All data is stored locally in your browser and never
                          leaves your device.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAccept}
                    className="flex-1 px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/20"
                  >
                    Accept Analytics
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    Reject
                  </button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  You can change your preferences at any time by clearing your
                  browser data.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
