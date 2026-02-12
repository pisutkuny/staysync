"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle, MapPin, Shield, Wifi, Globe } from "lucide-react";

export default function LandingPage() {
  const [lang, setLang] = useState<'TH' | 'EN'>('TH');

  const content = {
    TH: {
      hero: {
        title1: "StaySync หอพัก",
        title2: "ชีวิตที่ง่ายขึ้น",
        subtitle: "สัมผัสประสบการณ์การพักผ่อนที่ดีที่สุด ห้องพักทันสมัย สิ่งอำนวยความสะดวกครบครัน และระบบจัดการดิจิทัลที่ตอบโจทย์ทุกความต้องการ",
        bookBtn: "จองห้องพัก",
        loginBtn: "เข้าสู่ระบบผู้เช่า"
      },
      features: {
        title: "ทำไมต้องเลือกเรา",
        subtitle: "ทุกสิ่งที่คุณต้องการเพื่อการอยู่อาศัยที่สะดวกสบาย",
        wifi: {
          title: "อินเทอร์เน็ตความเร็วสูง",
          desc: "เชื่อมต่อไม่สะดุดด้วยอินเทอร์เน็ตไฟเบอร์ออปติก เหมาะสำหรับทุกการใช้งาน"
        },
        security: {
          title: "ระบบรักษาความปลอดภัย 24 ชม.",
          desc: "อุ่นใจด้วยกล้องวงจรปิด ระบบคีย์การ์ด และเจ้าหน้าที่ดูแลความปลอดภัย"
        },
        location: {
          title: "ทำเลทอง",
          desc: "เดินทางสะดวก ใกล้สถานศึกษา ร้านสะดวกซื้อ และระบบขนส่งสาธารณะ"
        }
      },
      cta: {
        title: "พร้อมเข้าอยู่หรือยัง?",
        subtitle: "ตรวจสอบห้องว่างได้ทันที",
        desc: "ดูห้องว่าง รายละเอียด และจองห้องพักออนไลน์ได้ทันที ไม่ต้องรอคิว",
        checkBtn: "เช็คห้องว่าง",
        benefits: {
          instant: "ยืนยันทันที",
          pricing: "ราคาโปร่งใส",
          payment: "จ่ายบิลออนไลน์"
        }
      },
      footer: {
        rights: "สงวนลิขสิทธิ์",
        privacy: "นโยบายความเป็นส่วนตัว",
        terms: "เงื่อนไขการให้บริการ",
        contact: "ติดต่อเรา"
      }
    },
    EN: {
      hero: {
        title1: "StaySync Dormitory",
        title2: "Living Made Simple",
        subtitle: "Experience the best in dormitory living. Modern rooms, great facilities, and a seamless digital experience for all your needs.",
        bookBtn: "Book A Room",
        loginBtn: "Tenant Login"
      },
      features: {
        title: "Why Choose Us",
        subtitle: "Everything You Need for Comfortable Living",
        wifi: {
          title: "High-Speed Wifi",
          desc: "Stay connected with our fiber-optic internet, perfect for streaming, gaming, and remote work."
        },
        security: {
          title: "24/7 Security",
          desc: "Your safety is our priority with CCTV surveillance, keycard access, and nightly patrols."
        },
        location: {
          title: "Prime Location",
          desc: "Located near universities, convenience stores, and public transport stations."
        }
      },
      cta: {
        title: "Ready to move in?",
        subtitle: "Check availability today.",
        desc: "Browse our available rooms, view details, and book your spot instantly online. No hassle, no waiting.",
        checkBtn: "Check Availability",
        benefits: {
          instant: "Instant Confirmation",
          pricing: "Transparent Pricing",
          payment: "Online Bill Payment"
        }
      },
      footer: {
        rights: "All rights reserved.",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        contact: "Contact"
      }
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-white relative">
      {/* Language Switcher - Floating Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')}
          className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white font-bold hover:bg-white/30 transition-all shadow-lg"
        >
          <Globe size={18} />
          {lang === 'TH' ? 'EN' : 'TH'}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl text-shadow-lg">
              <span className="block">{t.hero.title1}</span>
              <span className="block text-indigo-200 mt-2 text-3xl sm:text-4xl md:text-5xl">{t.hero.title2}</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-indigo-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              {t.hero.subtitle}
            </p>
            <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center gap-4">
              <Link href="/booking">
                <button className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-full text-indigo-700 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-10 shadow-xl transition-transform hover:scale-105">
                  {t.hero.bookBtn}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </Link>
              <Link href="/login">
                <button className="w-full flex items-center justify-center px-8 py-4 border-2 border-indigo-300 text-base font-bold rounded-full text-white hover:bg-white/10 md:py-4 md:text-lg md:px-10 transition-colors">
                  {t.hero.loginBtn}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 w-full">
          <svg className="w-full h-24 lg:h-48 text-white" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path fill="currentColor" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">{t.features.title}</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-indigo-50 transition-colors duration-300">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-6">
                <Wifi className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.features.wifi.title}</h3>
              <p className="text-gray-500">
                {t.features.wifi.desc}
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-indigo-50 transition-colors duration-300">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.features.security.title}</h3>
              <p className="text-gray-500">
                {t.features.security.desc}
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-indigo-50 transition-colors duration-300">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-6">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.features.location.title}</h3>
              <p className="text-gray-500">
                {t.features.location.desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Showcase / CTA Section */}
      <div className="bg-gray-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {/* Abstract Background */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-24 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="text-left lg:w-1/2">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              {t.cta.title}
              <span className="block text-indigo-400 mt-2">{t.cta.subtitle}</span>
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              {t.cta.desc}
            </p>
            <div className="mt-8">
              <Link href="/booking">
                <button className="inline-flex items-center px-8 py-3 border border-transparent text-base font-bold rounded-lg text-gray-900 bg-white hover:bg-gray-100 transition-colors">
                  {t.cta.checkBtn}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>

          {/* Simple Visual Rep */}
          <div className="lg:w-1/3 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center space-x-4 mb-6">
              <CheckCircle className="text-green-400 w-6 h-6" />
              <span className="text-white text-lg font-medium">{t.cta.benefits.instant}</span>
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <CheckCircle className="text-green-400 w-6 h-6" />
              <span className="text-white text-lg font-medium">{t.cta.benefits.pricing}</span>
            </div>
            <div className="flex items-center space-x-4">
              <CheckCircle className="text-green-400 w-6 h-6" />
              <span className="text-white text-lg font-medium">{t.cta.benefits.payment}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              StaySync
            </span>
            <p className="text-sm text-gray-500 mt-1">© 2026 StaySync. {t.footer.rights}</p>
          </div>
          <div className="flex space-x-6 text-gray-400">
            <a href="#" className="hover:text-gray-500">{t.footer.privacy}</a>
            <a href="#" className="hover:text-gray-500">{t.footer.terms}</a>
            <a href="#" className="hover:text-gray-500">{t.footer.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
