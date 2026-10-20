/**
 * ExploreMate Footer
 * Required company credentials, customer service numbers, copyright, and policy links.
 */

import React from 'react';
import { Phone, Mail, Clock, Heart } from 'lucide-react';
import { BRAND_NAME, CONTACT_PHONE } from '../../config/constants';

export default function Footer({ onNavigate }) {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm pt-12 pb-24 md:pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Summary */}
        <div className="space-y-3">
          <h4 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
            {BRAND_NAME}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Pondicherry's exclusive AI-guided eco-travel companion. Designed to honor the French-Tamil coastal heritage and promote sustainable local tourism.
          </p>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
            OpenStreetMap &copy; contributors (ODbL)
          </div>
        </div>

        {/* Customer Service */}
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Customer Service
          </h5>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li className="font-medium text-slate-800 dark:text-slate-200">
              Explore Mate Team
            </li>
            <li className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-mustard-600 dark:text-mustard-400" />
              <a href={`tel:${CONTACT_PHONE}`} className="hover:underline">
                {CONTACT_PHONE}
              </a>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="w-3.5 h-3.5 text-mustard-600 dark:text-mustard-400" />
              <a href="mailto:exploremateservices@gmail.com" className="hover:underline">
                exploremateservices@gmail.com
              </a>
            </li>
            <li className="flex items-center space-x-2 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Open all days (Monday – Sunday)</span>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Quick Links
          </h5>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li><button onClick={() => onNavigate('home')} className="hover:underline">Home</button></li>
            <li><button onClick={() => onNavigate('plan')} className="hover:underline">Smart Plan</button></li>
            <li><button onClick={() => onNavigate('destinations')} className="hover:underline">Destinations</button></li>
            <li><button onClick={() => onNavigate('stays')} className="hover:underline">Stays & Hostels</button></li>
            <li><button onClick={() => onNavigate('before_you_go')} className="hover:underline">Before You Go</button></li>
            <li><button onClick={() => onNavigate('chapters')} className="hover:underline">Carbon Chapters</button></li>
          </ul>
        </div>

        {/* Legal & Safety */}
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Safety & Legal
          </h5>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li><span className="font-semibold text-red-600 dark:text-red-400">Police: 100</span> | Tourist: 1363</li>
            <li><button onClick={() => onNavigate('about')} className="hover:underline">About ExploreMate</button></li>
            <li><button onClick={() => onNavigate('privacy')} className="hover:underline">Privacy Policy</button></li>
            <li><button onClick={() => onNavigate('terms')} className="hover:underline">Terms of Service</button></li>
            <li><button onClick={() => onNavigate('credits')} className="hover:underline">Data Sources & Credits</button></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>&copy; 2026 {BRAND_NAME}. Built for the Zephyr hackathon. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> for Pondicherry / Puducherry • Sustainable Smart Tourism
        </p>
      </div>
    </footer>
  );
}
