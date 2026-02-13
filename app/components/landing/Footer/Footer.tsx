'use client';

import Link from 'next/link';
import { Star, Twitter, Github, MessageCircle } from 'lucide-react';
import { APP_CONFIG, FOOTER_SECTIONS } from '@/constants';
import { cn } from '@/lib';
import type { FooterProps } from './Footer.types';

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('border-t border-white/10 py-12 px-4', className)}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#3c3cf6] rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" fill="white" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {APP_CONFIG.appName}
              </h3>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              {APP_CONFIG.appDescription}. Empowering creators with blockchain technology.
            </p>
            <div className="flex gap-4">
              <a
                href={APP_CONFIG.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:bg-[#3c3cf6]/20 transition-all"
              >
                <Twitter className="w-5 h-5 text-gray-400" />
              </a>
              <a
                href={APP_CONFIG.social.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:bg-[#3c3cf6]/20 transition-all"
              >
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </a>
              <a
                href={APP_CONFIG.social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:bg-[#3c3cf6]/20 transition-all"
              >
                <Github className="w-5 h-5 text-gray-400" />
              </a>
            </div>
          </div>

          {/* Footer Sections */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-bold mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 {APP_CONFIG.appName}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
