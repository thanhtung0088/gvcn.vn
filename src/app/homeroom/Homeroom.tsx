"use client";
import React, { useState, useRef, useMemo } from 'react';
import {
  Users, Calendar, Video, FileText, ClipboardList, LayoutGrid, ClipboardPaste,
  Trash2, UserCheck, MessageSquare, Sparkles, ChevronDown, PenTool, X, Save,
  Trophy, BrainCircuit, Search, ExternalLink, Clock, Send, Upload, FileSpreadsheet,
  CheckCircle2, Loader2, Plus, Filter, Download, MoreHorizontal, BookOpen,
  Shield, AlertTriangle, Star, TrendingUp, Phone, Home, Award, Megaphone,
  ChevronLeft, ChevronRight, Printer, Edit3, Eye
} from 'lucide-react';

// ============================================================
// KIỂU DỮ LIỆU
// ============================================================

interface Student {
  id: number;
  name: string;
  gender: string;
  dob: string;
  phone: string;
  parentName: string;
  status: string;          // Tốt / Khá / Đạt / Chưa đạt
  seat: number;
  note: string;
}

interface WeeklyPlan {
  id: number;
  week: number;
  title: string;
  content: string;
  category: 'Sinh hoạt' | 'Học tập' | 'Phong trào' | 'Khác';
  done: boolean;
}

interface MeetingRecord {
  id: number;
  title: string;
  date: string;
  type: string;
  attendees: number;
  content: string;
}

interface Task {
  id: number;
  title: string;
  assignedTo: string;
  deadline: string;
  status: 'Chưa làm' | 'Đang làm' | 'Hoàn thành';
  priority: 'Cao' | 'Trung bình' | 'Thấp';
}

interface EmulationEntry {
  id: number;
  studentId: number;
  week: number;
  point: number;        // 0-10
  violations: string;
  praise: string;
}

// ============================================================
// HẰNG SỐ NGHIỆP VỤ – Căn cứ pháp lý
// ============================================================

const LEGAL_BASES = [
  { code: 'Thông tư 05/2025/TT-BGDĐT', desc: 'Chế độ làm việc GV phổ thông (hiệu lực 22/4/2025)' },
  { code: 'Thông tư 19/2025/TT-BGDĐT', desc: 'Khen thưởng & kỷ luật HS (hiệu lực 31/10/2025)' },
  { code: 'Thông tư 32/2020/TT-BGDĐT', desc: 'Điều lệ trường THCS, THPT & trường phổ thông nhiều cấp' },
  { code: 'Thông tư 22/2021/TT-BGDĐT', desc: 'Đánh giá HS THCS & THPT (4 mức: Tốt/Khá/Đạt/Chưa đạt)' },
];

const DUTIES_GVCN = [
  {
    icon: Users,
    title: 'Quản lý lớp & Học sinh',
    items: [
      'Chủ động nắm bắt thông tin học sinh được phân công chủ nhiệm',
      'Xây dựng và tổ chức thực hiện kế hoạch hoạt động của lớp',
      'Tổ chức các hoạt động sinh hoạt lớp, thúc đẩy sự tiến bộ',
    ],
  },
  {
    icon: MessageSquare,
    title: 'Phối hợp các bên liên quan',
    items: [
      'Phối hợp với cha mẹ học sinh / người giám hộ',
      'Phối hợp với giáo viên bộ môn trong lớp',
      'Phối hợp với Đoàn TNCS HCM, Đội TNTP HCM và đoàn thể',
    ],
  },
  {
    icon: ClipboardList,
    title: 'Đánh giá & Tổng hợp',
    items: [
      'Tổng hợp nhận xét, đánh giá HS cuối HK1 và cuối năm',
      'Hướng dẫn HS bình bầu và đề nghị khen thưởng',
      'Lập danh sách đề nghị lên lớp, không lên lớp, rèn luyện hè',
    ],
  },
  {
    icon: FileText,
    title: 'Hồ sơ & Sổ sách',
    items: [
      'Sổ chủ nhiệm (theo Điều 21 – Thông tư 32/2020)',
      'Kế hoạch giáo dục năm học',
      'Sổ theo dõi và đánh giá học sinh',
    ],
  },
];

const CONDUCT_RANKS = [
  { value: 'Tốt', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { value: 'Khá', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { value: 'Đạt', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { value: 'Chưa đạt', color: 'text-rose-600 bg-rose-50 border-rose-100' },
];

// ============================================================
// COMPONENT CHÍNH
// ============================================================

export const Homeroom = () => {
  const [activeTab, setActiveTab] = useState('seating');
  const [students, setStudents] = useState<Student[]>([
    {
      id: 1, name: 'NGUYỄN VĂN AN', gender: 'Nam', dob: '12/05/2012',
      phone: '0901234567', parentName: 'Nguyễn Văn Bình', status: 'Tốt',
      seat: 1, note: '',
    },
    {
      id: 2, name: 'TRẦN THỊ BÌNH', gender: 'Nữ', dob: '20/08/2012',
      phone: '0912345678', parentName: 'Trần Văn Cường', status: 'Khá',
      seat: 2, note: '',
    },
  ]);

  // --- Sơ đồ lớp ---
  const [seatingData, setSeatingData] = useState<string[]>(Array(24).fill(''));

  // --- Nhập liệu ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Tìm kiếm HS ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- Kế hoạch tuần ---
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([
    { id: 1, week: 24, title: 'Sinh hoạt dưới cờ', content: 'Chủ đề: An toàn giao thông', category: 'Sinh hoạt', done: true },
    { id: 2, week: 24, title: 'Vệ sinh lớp học', content: 'Phân công tổ 1, tổ 2', category: 'Khác', done: false },
    { id: 3, week: 24, title: 'Đại hội TDTT', content: 'Đăng ký các môn thi đấu', category: 'Phong trào', done: false },
    { id: 4, week: 24, title: 'Bồi dưỡng HSG', content: 'Toán, Văn – Thứ 3, Thứ 5', category: 'Học tập', done: false },
  ]);

  // --- Biên bản ---
  const [meetings] = useState<MeetingRecord[]>([
    { id: 1, title: 'Đại hội Chi đội', date: '05/09/2025', type: 'Nghị quyết', attendees: 42, content: 'Bầu BCH Chi đội nhiệm kỳ 2025–2026' },
    { id: 2, title: 'Họp PHHS Đầu năm', date: '12/09/2025', type: 'Biên bản', attendees: 38, content: 'Thông qua kế hoạch năm học, nội quy lớp' },
    { id: 3, title: 'Sơ kết Học kỳ 1', date: '15/01/2026', type: 'Báo cáo', attendees: 40, content: 'Đánh giá kết quả HK1, đề ra phương hướng HK2' },
  ]);

  // --- Thi đua ---
  const [emulation, setEmulation] = useState<EmulationEntry[]>([
    { id: 1, studentId: 1, week: 24, point: 9.5, violations: '', praise: 'Học tập xuất sắc' },
    { id: 2, studentId: 2, week: 24, point: 8.0, violations: 'Đi muộn 1 lần', praise: '' },
  ]);

  // --- Lọc HS theo tìm kiếm ---
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.parentName.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // ==========================================================
  // XỬ LÝ SƠ ĐỒ LỚP
  // ==========================================================
  const handleNameChange = (index: number, value: string) => {
    const newData = [...seatingData];
    newData[index] = value.toUpperCase();
    setSeatingData(newData);
  };

  const renderDeskGroup = (startIndex: number) => (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={startIndex + i}
          type="text"
          value={seatingData[startIndex + i]}
          onChange={(e) => handleNameChange(startIndex + i, e.target.value)}
          placeholder={`Bàn ${startIndex + i + 1}`}
          className="w-full h-10 bg-[#4a77d4] text-white text-center text-[10px] font-black uppercase placeholder:text-white/40 border-none rounded-sm shadow-md focus:ring-2 focus:ring-amber-400 outline-none transition-all"
        />
      ))}
    </div>
  );

  // ==========================================================
  // XỬ LÝ EXCEL & CLIPBOARD
  // ==========================================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const imported: Student[] = data.slice(1).map((row, index) => ({
          id: students.length + index + 1,
          name: String(row[0] || '').toUpperCase(),
          gender: String(row[1] || ''),
          dob: String(row[2] || ''),
          phone: String(row[3] || ''),
          parentName: String(row[4] || ''),
          status: 'Tốt',
          seat: students.length + index + 1,
          note: '',
        }));
        setStudents([...students, ...imported]);
      } catch (error) {
        console.error('Lỗi đọc file:', error);
      } finally {
        setIsImporting(false);
        setShowImportModal(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessPaste = () => {
    if (!pasteData.trim()) return;
    setIsImporting(true);
    setTimeout(() => {
      const rows = pasteData.trim().split(/\r?\n/);
      const newStudents: Student[] = rows.map((row, index) => {
        const cols = row.split(/\t/);
        return {
          id: students.length + index + 1,
          name: String(cols[0] || '').toUpperCase(),
          gender: String(cols[1] || ''),
          dob: String(cols[2] || ''),
          phone: String(cols[3] || ''),
          parentName: String(cols[4] || ''),
          status: 'Tốt',
          seat: students.length + index + 1,
          note: '',
        };
      });
      setStudents([...students, ...newStudents]);
      setIsImporting(false);
      setShowImportModal(false);
      setPasteData('');
    }, 500);
  };

  // ==========================================================
  // TIỆN ÍCH
  // ==========================================================
  const text3DStyle = { textShadow: '1px 1px 0px #fff, 2px 2px 4px rgba(0,0,0,0.1)' };

  const getConductStyle = (status: string) =>
    CONDUCT_RANKS.find((r) => r.value === status)?.color ||
    'text-slate-600 bg-slate-50 border-slate-100';

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 pb-10 font-sans">

      {/* ============ HEADER CHÍNH ============ */}
      <div className="backdrop-blur-md bg-white/80 rounded-2xl p-5 border border-white/50 shadow-xl flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#0052cc] rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
            <Users size={28} />
          </div>
          <div>
            <h1
              className="text-2xl font-black text-slate-800 uppercase tracking-tighter"
              style={text3DStyle}
            >
              Quản lý Hồ sơ Chủ nhiệm
            </h1>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded border border-indigo-100 italic">
                Lớp: 6A1
              </span>
              <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded border border-emerald-100 italic">
                Sĩ số: {students.length} HS
              </span>
              <span className="text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-1 rounded border border-amber-100 italic">
                Năm học: 2025–2026
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open('https://meet.google.com', '_blank')}
            className="bg-[#008373] text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Video size={16} /> Họp PH Trực tuyến
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-[#0052cc] text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
          >
            <ClipboardPaste size={16} /> Nhập Excel nhanh
          </button>
        </div>
      </div>

      {/* ============ NAVIGATION TABS ============ */}
      <div className="flex gap-1 overflow-x-auto bg-slate-200/50 backdrop-blur-sm p-1.5 rounded-2xl w-fit z-10 relative border border-white/20">
        {[
          { id: 'seating', label: 'Sơ đồ lớp', icon: LayoutGrid },
          { id: 'profile', label: 'Hồ sơ HS', icon: UserCheck },
          { id: 'meeting', label: 'Biên bản & Hội họp', icon: ClipboardList },
          { id: 'plan', label: 'Kế hoạch Tuần/Tháng', icon: Calendar },
          { id: 'emulation', label: 'Thi đua & Nhận xét AI', icon: BrainCircuit },
          { id: 'duties', label: 'Nghiệp vụ GVCN', icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-[#0052cc] shadow-md scale-105'
                : 'text-slate-500 hover:bg-white/40'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ============ CONTENT AREA ============ */}
      <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">

        {/* ========== TAB 1: SƠ ĐỒ LỚP ========== */}
        {activeTab === 'seating' && (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col min-h-[700px]">
            <div className="flex justify-between gap-12 max-w-6xl mx-auto italic mb-20 w-full">
              <div className="flex-1 grid grid-cols-2 gap-8">
                {renderDeskGroup(0)}
                {renderDeskGroup(6)}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-8">
                {renderDeskGroup(12)}
                {renderDeskGroup(18)}
              </div>
            </div>
            <div className="mt-auto pt-10 border-t-4 border-slate-50 flex items-end justify-between px-10 relative">
              <div className="flex-1 flex justify-center">
                <div className="w-2/3 h-16 bg-slate-800 rounded-t-3xl border-x-8 border-t-8 border-slate-700 flex items-center justify-center shadow-2xl">
                  <span className="text-white/30 font-black text-[14px] uppercase tracking-[1.5em]">
                    Bảng Đen
                  </span>
                </div>
              </div>
              <div className="w-56 h-24 bg-[#4a77d4] rounded-sm shadow-xl flex flex-col items-center justify-center border-2 border-white/20 group relative">
                <span className="text-white font-black text-[11px] uppercase tracking-widest">
                  Bàn Giáo Viên
                </span>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 px-3 py-1 rounded-full shadow-md">
                  <PenTool size={12} className="text-white" />
                </div>
              </div>
            </div>
            <div className="absolute top-12 bottom-40 pointer-events-none border-x border-slate-100 border-dashed left-1/2 w-[2px]"></div>
          </div>
        )}

        {/* ========== TAB 2: HỒ SƠ HỌC SINH ========== */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 bg-slate-50 border-b flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm học sinh / phụ huynh..."
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] outline-none focus:border-[#0052cc] w-64 shadow-sm"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50">
                  <Filter size={14} /> Lọc dữ liệu
                </button>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase border border-emerald-100 hover:bg-emerald-100">
                  <Download size={14} /> Xuất báo cáo
                </button>
                <button
                  onClick={() => setStudents([])}
                  className="bg-rose-50 text-rose-500 p-2.5 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase border-b">
                  <tr>
                    <th className="p-5 w-16 text-center">STT</th>
                    <th className="p-5">Họ và tên học sinh</th>
                    <th className="p-5 w-20 text-center">Giới tính</th>
                    <th className="p-5">Ngày sinh</th>
                    <th className="p-5">Phụ huynh</th>
                    <th className="p-5">Liên hệ Phụ huynh</th>
                    <th className="p-5">Hạnh kiểm</th>
                    <th className="p-5 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st, i) => (
                    <tr key={st.id} className="hover:bg-indigo-50/30 transition-all group">
                      <td className="p-5 text-[11px] font-bold text-slate-400 text-center">{i + 1}</td>
                      <td className="p-5 text-[11px] font-black text-slate-700 uppercase italic tracking-tight">
                        {st.name}
                      </td>
                      <td className="p-5 text-[11px] text-slate-500 text-center">{st.gender}</td>
                      <td className="p-5 text-[11px] text-slate-500 font-medium">{st.dob}</td>
                      <td className="p-5 text-[11px] text-slate-600 font-bold">{st.parentName}</td>
                      <td className="p-5 text-[11px] font-mono font-bold text-[#0052cc]">
                        {st.phone}
                      </td>
                      <td className="p-5">
                        <span
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${getConductStyle(st.status)}`}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <button className="p-2 text-slate-300 group-hover:text-slate-600">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Thống kê hạnh kiểm */}
            <div className="p-5 border-t bg-slate-50/50 flex gap-6 flex-wrap">
              {CONDUCT_RANKS.map((rank) => {
                const count = students.filter((s) => s.status === rank.value).length;
                return (
                  <div key={rank.value} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${rank.color.split(' ')[0].replace('text-', 'bg-')}`}></span>
                    <span className="text-[10px] font-black uppercase text-slate-500">
                      {rank.value}: {count} HS
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== TAB 3: BIÊN BẢN ========== */}
        {activeTab === 'meeting' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-[#0052cc]"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-[#0052cc]">
                    <FileText size={24} />
                  </div>
                  <span className="text-[9px] font-black uppercase bg-slate-100 px-2 py-1 rounded-lg text-slate-500">
                    {m.type}
                  </span>
                </div>
                <h4 className="text-[13px] font-black text-slate-800 uppercase mb-1">
                  {m.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mb-2">
                  <Clock size={12} /> {m.date}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mb-4">
                  <Users size={12} /> {m.attendees} người tham dự
                </div>
                <p className="text-[10px] text-slate-500 italic mb-6 line-clamp-2">{m.content}</p>
                <button className="w-full py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0052cc] transition-colors flex items-center justify-center gap-2">
                  Xem chi tiết <ExternalLink size={14} />
                </button>
              </div>
            ))}
            <button className="border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-[#0052cc] hover:text-[#0052cc] transition-all bg-slate-50/50 min-h-[260px]">
              <Plus size={40} />
              <span className="text-[10px] font-black uppercase">Tạo biên bản mới</span>
            </button>
          </div>
        )}

        {/* ========== TAB 4: KẾ HOẠCH ========== */}
        {activeTab === 'plan' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col lg:flex-row gap-8">
            {/* Cột kế hoạch tuần */}
            <div className="w-full lg:w-80 shrink-0 space-y-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">
                Kế hoạch tuần 24
              </h4>
              {weeklyPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 rounded-2xl border flex items-center gap-3 group transition-all cursor-pointer ${
                    plan.done
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200 hover:border-[#0052cc]'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      plan.done ? 'bg-emerald-400' : 'bg-indigo-400'
                    }`}
                  ></div>
                  <div className="flex-1">
                    <span className="text-[11px] font-black text-slate-700 uppercase block">
                      {plan.title}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">{plan.content}</span>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                      plan.category === 'Học tập'
                        ? 'bg-blue-50 text-blue-600'
                        : plan.category === 'Phong trào'
                        ? 'bg-amber-50 text-amber-600'
                        : plan.category === 'Sinh hoạt'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {plan.category}
                  </span>
                </div>
              ))}
              <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-[#0052cc] hover:text-[#0052cc] transition-all flex items-center justify-center gap-2">
                <Plus size={14} /> Thêm hoạt động
              </button>
            </div>

            {/* Lịch tháng */}
            <div className="flex-1 bg-slate-50 rounded-[2rem] border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-slate-800 uppercase italic">
                  Lịch chủ nhiệm tháng 03/2026
                </h3>
                <div className="flex gap-2">
                  <button className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                    <ChevronLeft size={18} className="text-slate-400" />
                  </button>
                  <button className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                    <ChevronRight size={18} className="text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                  <div key={d} className="text-center text-[10px] font-black text-slate-400 pb-4">
                    {d}
                  </div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-2xl border bg-white flex items-center justify-center text-[11px] font-bold ${
                      i + 1 === 12
                        ? 'bg-[#0052cc] text-white shadow-lg border-[#0052cc]'
                        : 'text-slate-600 border-slate-100 hover:border-indigo-300'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== TAB 5: THI ĐUA AI ========== */}
        {activeTab === 'emulation' && (
          <div className="space-y-6">
            {/* Thống kê nhanh */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg">
                <Trophy size={32} className="mb-4 opacity-50" />
                <h5 className="text-[10px] font-black uppercase opacity-70">Hạng thi đua Tuần</h5>
                <p className="text-3xl font-black italic">Hạng 02/45</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <h5 className="text-[10px] font-black uppercase text-slate-400 mb-1">Điểm nề nếp</h5>
                <p className="text-3xl font-black text-emerald-600">98.5</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <h5 className="text-[10px] font-black uppercase text-slate-400 mb-1">Vi phạm tuần</h5>
                <p className="text-3xl font-black text-rose-500">
                  {emulation.filter((e) => e.violations).length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <h5 className="text-[10px] font-black uppercase text-slate-400 mb-1">Tuyên dương</h5>
                <p className="text-3xl font-black text-amber-500">
                  {emulation.filter((e) => e.praise).length}
                </p>
              </div>
            </div>

            {/* Bảng thi đua chi tiết */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
                <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Star size={16} className="text-amber-500" /> Bảng thi đua Tuần 24 – Lớp 6A1
                </h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50">
                  <Printer size={14} /> In bảng
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase border-b">
                  <tr>
                    <th className="p-4 text-center w-16">STT</th>
                    <th className="p-4">Học sinh</th>
                    <th className="p-4 text-center w-24">Điểm</th>
                    <th className="p-4">Vi phạm</th>
                    <th className="p-4">Tuyên dương</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emulation.map((e, i) => {
                    const stu = students.find((s) => s.id === e.studentId);
                    return (
                      <tr key={e.id} className="hover:bg-indigo-50/30 transition-all">
                        <td className="p-4 text-[11px] font-bold text-slate-400 text-center">{i + 1}</td>
                        <td className="p-4 text-[11px] font-black text-slate-700 uppercase italic">
                          {stu?.name || '—'}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-lg text-[11px] font-black ${
                              e.point >= 9
                                ? 'bg-emerald-50 text-emerald-600'
                                : e.point >= 7
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {e.point.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-4 text-[11px] text-slate-500 italic">
                          {e.violations || '—'}
                        </td>
                        <td className="p-4 text-[11px] text-emerald-600 font-bold italic">
                          {e.praise || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Trợ lý AI */}
            <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <Sparkles className="absolute top-6 right-8 text-amber-400 opacity-50" size={60} />
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                    <BrainCircuit size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">
                      Trợ lý Phân tích AI
                    </h3>
                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
                      Dựa trên dữ liệu thi đua tuần 24
                    </p>
                  </div>
                </div>
                <p className="text-[13px] font-medium leading-relaxed italic text-indigo-100 mb-8">
                  "Dựa trên dữ liệu thi đua, lớp 6A1 có sự tiến bộ vượt bậc về chuyên cần.
                  Đề xuất tuyên dương học sinh Nguyễn Văn An vì có thành tích học tập xuất sắc
                  trong tuần qua. Lưu ý học sinh Trần Thị Bình cần cải thiện giờ giấc đi học."
                </p>
                <div className="flex gap-3">
                  <button className="px-6 py-3 bg-white text-indigo-900 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-amber-400 hover:text-indigo-950 transition-all">
                    <Send size={16} /> Gửi nhận xét cho Phụ huynh
                  </button>
                  <button className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/20 transition-all">
                    <Edit3 size={16} /> Chỉnh sửa nhận xét
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== TAB 6: NGHIỆP VỤ GVCN ========== */}
        {activeTab === 'duties' && (
          <div className="space-y-6">
            {/* Nhiệm vụ chính */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DUTIES_GVCN.map((duty, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-[#0052cc] group-hover:bg-[#0052cc] group-hover:text-white transition-all">
                      <duty.icon size={22} />
                    </div>
                    <h4 className="text-[12px] font-black text-slate-800 uppercase">
                      {duty.title}
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {duty.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-[11px] text-slate-600">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Căn cứ pháp lý */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-6">
                <Shield size={18} className="text-[#0052cc]" /> Căn cứ pháp lý công tác GVCN
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LEGAL_BASES.map((lb, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <div className="p-2 bg-[#0052cc] rounded-lg text-white shrink-0">
                      <FileText size={14} />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-[#0052cc] block">
                        {lb.code}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{lb.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lưu ý quan trọng */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-2xl shrink-0">
                <AlertTriangle size={22} className="text-amber-600" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-amber-800 uppercase mb-2">
                  Lưu ý nghiệp vụ quan trọng
                </h4>
                <ul className="space-y-1.5 text-[11px] text-amber-700">
                  <li>• GVCN phải chủ động nắm bắt thông tin HS, xây dựng kế hoạch hoạt động lớp nhằm thúc đẩy sự tiến bộ của từng học sinh.</li>
                  <li>• Phối hợp chặt chẽ với CMHS, GV bộ môn, Đoàn – Đội để tổ chức hoạt động giáo dục và hỗ trợ HS.</li>
                  <li>• Tổng hợp nhận xét, đánh giá HS cuối mỗi học kỳ và cuối năm học; hướng dẫn HS bình bầu khen thưởng.</li>
                  <li>• Sổ chủ nhiệm là hồ sơ bắt buộc theo Điều 21 Thông tư 32/2020/TT-BGDĐT.</li>
                  <li>• Hình thức kỷ luật HS THCS: nhắc nhở, phê bình, yêu cầu viết bản tự kiểm điểm (có xác nhận gia đình).</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ MODAL NHẬP DỮ LIỆU EXCEL ============ */}
      {showImportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowImportModal(false)}
          ></div>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-600" /> Nhập hồ sơ học sinh
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 italic">
                  Hỗ trợ dán trực tiếp hoặc tải file
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-white rounded-full transition-colors shadow-sm border"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer bg-slate-50/30"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Upload size={24} className="text-emerald-600" />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-black text-slate-700 uppercase">
                    Chọn file Excel
                  </span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                    Định dạng: .xlsx, .xls, .csv
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <span className="relative px-4 bg-white text-[9px] font-black text-slate-300 uppercase italic">
                  Hoặc dán dữ liệu
                </span>
              </div>
              <div className="space-y-3">
                <textarea
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-[11px] font-medium outline-none focus:border-emerald-400 transition-all resize-none shadow-inner"
                  placeholder="Sao chép từ Excel rồi dán vào đây..."
                />
                <div className="flex items-center gap-2 text-[9px] font-bold text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 italic">
                  <CheckCircle2 size={14} /> Mẫu: Họ tên → Giới tính → Ngày sinh → SĐT → Tên PH
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleProcessPaste}
                  disabled={!pasteData || isImporting}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-600 transition-all disabled:bg-slate-300"
                >
                  {isImporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}{' '}
                  Xác nhận nhập
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homeroom;
