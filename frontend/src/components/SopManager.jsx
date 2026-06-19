import React, { useState } from 'react';
import { Plus, Trash2, Edit3, ClipboardList, Check, Save } from 'lucide-react';

export default function SopManager({ sops, onSaveSop, onDeleteSop }) {
  const [selectedSop, setSelectedSop] = useState(sops[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  // Form states
  const [editId, setEditId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('opening');
  const [editDescription, setEditDescription] = useState('');
  const [editTargetStaff, setEditTargetStaff] = useState('All Staff');
  const [editSteps, setEditSteps] = useState([{ id: 'step-1', text: '', checked: false }]);

  // Category list and labels in Thai
  const categories = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'opening', label: 'เปิดร้าน' },
    { value: 'closing', label: 'ปิดร้าน' },
    { value: 'kitchen', label: 'งานครัว' },
    { value: 'bar', label: 'งานบาร์' },
    { value: 'shift_handover', label: 'งานเปลี่ยนผลัด' },
    { value: 'cleaning', label: 'ทำความสะอาด' }
  ];

  const getCategoryLabel = (val) => {
    const found = categories.find(c => c.value === val);
    return found ? found.label : val;
  };

  const handleSelectSop = (sop) => {
    setSelectedSop(sop);
    setIsEditing(false);
  };

  const handleStartAdd = () => {
    setEditId('');
    setEditTitle('');
    setEditCategory('opening');
    setEditDescription('');
    setEditTargetStaff('All Staff');
    setEditSteps([{ id: `step-${Date.now()}-1`, text: '', checked: false }]);
    setIsEditing(true);
  };

  const handleStartEdit = (sop) => {
    setEditId(sop.id);
    setEditTitle(sop.title);
    setEditCategory(sop.category);
    setEditDescription(sop.description);
    setEditTargetStaff(sop.targetStaff);
    setEditSteps(sop.steps.length > 0 ? [...sop.steps] : [{ id: `step-${Date.now()}-1`, text: '', checked: false }]);
    setIsEditing(true);
  };

  const handleAddStepField = () => {
    setEditSteps([...editSteps, { id: `step-${Date.now()}-${editSteps.length + 1}`, text: '', checked: false }]);
  };

  const handleRemoveStepField = (index) => {
    if (editSteps.length === 1) return; // Keep at least one
    const newSteps = editSteps.filter((_, i) => i !== index);
    setEditSteps(newSteps);
  };

  const handleStepTextChange = (index, val) => {
    const newSteps = [...editSteps];
    newSteps[index].text = val;
    setEditSteps(newSteps);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      alert('กรุณากรอกชื่อ SOP');
      return;
    }
    const cleanSteps = editSteps.filter(s => s.text.trim() !== '');
    if (cleanSteps.length === 0) {
      alert('กรุณากรอกขั้นตอนอย่างน้อย 1 ขั้นตอน');
      return;
    }

    const sopData = {
      id: editId || undefined,
      title: editTitle,
      category: editCategory,
      description: editDescription,
      targetStaff: editTargetStaff,
      steps: cleanSteps
    };

    onSaveSop(sopData);
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('คุณแน่ใจว่าต้องการลบ SOP นี้? (กำหนดการส่งแจ้งเตือนที่ผูกไว้จะถูกปิดใช้งานด้วย)')) {
      onDeleteSop(id);
      if (selectedSop && selectedSop.id === id) {
        setSelectedSop(sops.filter(s => s.id !== id)[0] || null);
      }
    }
  };

  // Filter logic
  const filteredSops = filterCategory === 'all' 
    ? sops 
    : sops.filter(s => s.category === filterCategory);

  // Checkbox toggle logic to simulate FOH check list interaction
  const handleToggleStepMock = (sopId, stepId) => {
    if (!selectedSop || selectedSop.id !== sopId) return;
    const updatedSteps = selectedSop.steps.map(s => {
      if (s.id === stepId) {
        return { ...s, checked: !s.checked };
      }
      return s;
    });
    
    // Update locally in parent sops as well
    const updatedSop = { ...selectedSop, steps: updatedSteps };
    setSelectedSop(updatedSop);
    onSaveSop(updatedSop, true); // silent save
  };

  return (
    <div className="sop-grid">
      {/* Left Pane: SOP List and Filter */}
      <div className="sops-list-panel">
        <div className="card">
          <div className="card-title-row" style={{marginBottom: '1rem'}}>
            <h2>คลังคู่มือ SOP</h2>
            <button className="btn btn-primary btn-icon-only" onClick={handleStartAdd} title="สร้าง SOP ใหม่">
              <Plus size={18} />
            </button>
          </div>

          {/* Category Filters */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {categories.map(cat => (
              <button
                key={cat.value}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  backgroundColor: filterCategory === cat.value ? 'var(--accent-green)' : 'rgba(255,255,255,0.03)',
                  borderColor: filterCategory === cat.value ? 'var(--accent-green)' : 'var(--border-card)',
                  color: filterCategory === cat.value ? '#fff' : 'var(--text-secondary)'
                }}
                onClick={() => setFilterCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="list-container" style={{ maxHeight: '500px' }}>
            {filteredSops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                ไม่พบคู่มือในหมวดหมู่นี้
              </div>
            ) : (
              filteredSops.map(sop => (
                <div 
                  key={sop.id} 
                  className={`sop-card ${selectedSop && selectedSop.id === sop.id ? 'selected' : ''}`}
                  onClick={() => handleSelectSop(sop)}
                >
                  <div className="sop-card-header">
                    <div>
                      <h3>{sop.title}</h3>
                      <span className="item-subtitle" style={{marginTop: '0.2rem', display: 'block'}}>{sop.description}</span>
                    </div>
                    <span className={`badge badge-${sop.category}`}>
                      {getCategoryLabel(sop.category)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span className="sop-steps-count">
                      <ClipboardList size={14} /> {sop.steps.length} ขั้นตอน
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      เป้าหมาย: {sop.targetStaff}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Pane: View / Edit detail */}
      <div className="sop-detail-panel">
        {isEditing ? (
          /* Create / Edit Form */
          <div className="card">
            <h2>{editId ? 'แก้ไขคู่มือ SOP' : 'สร้างคู่มือ SOP ใหม่'}</h2>
            <form onSubmit={handleSave} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>ชื่อ SOP *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="เช่น ขั้นตอนเปิดตู้เย็นเช้า FOH"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>หมวดหมู่</label>
                  <select 
                    className="form-control"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    <option value="opening">เปิดร้าน</option>
                    <option value="closing">ปิดร้าน</option>
                    <option value="kitchen">งานครัว</option>
                    <option value="bar">งานบาร์</option>
                    <option value="shift_handover">เปลี่ยนผลัด</option>
                    <option value="cleaning">ทำความสะอาด</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>กลุ่มผู้รับผิดชอบหลัก</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editTargetStaff}
                    onChange={(e) => setEditTargetStaff(e.target.value)}
                    placeholder="เช่น ครัวซอส, บริการหน้าร้าน"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>คำอธิบายโดยย่อ</label>
                <textarea 
                  className="form-control" 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="รายละเอียดสั้นๆ เพื่อให้พนักงานเข้าใจภาพรวมภารกิจ"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>รายการขั้นตอนปฏิบัติงาน *</span>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }} onClick={handleAddStepField}>
                    + เพิ่มข้อปฏิบัติ
                  </button>
                </label>
                
                <div className="steps-builder">
                  {editSteps.map((step, idx) => (
                    <div className="step-builder-row" key={step.id}>
                      <span className="step-number-tag">{idx + 1}</span>
                      <input 
                        type="text" 
                        className="form-control"
                        value={step.text}
                        onChange={(e) => handleStepTextChange(idx, e.target.value)}
                        placeholder={`ขั้นตอนที่ ${idx + 1}`}
                        required
                      />
                      <button 
                        type="button" 
                        className="btn btn-danger btn-icon-only"
                        disabled={editSteps.length === 1}
                        onClick={() => handleRemoveStepField(idx)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        ) : selectedSop ? (
          /* SOP Detail View & Simulated Checklist Interaction */
          <div className="card">
            <div className="card-title-row" style={{ alignItems: 'flex-start' }}>
              <div>
                <span className={`badge badge-${selectedSop.category}`} style={{ marginBottom: '0.5rem' }}>
                  {getCategoryLabel(selectedSop.category)}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{selectedSop.title}</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>{selectedSop.description}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-icon-only" onClick={() => handleStartEdit(selectedSop)} title="แก้ไข SOP">
                  <Edit3 size={16} />
                </button>
                <button className="btn btn-danger btn-icon-only" onClick={() => handleDelete(selectedSop.id)} title="ลบ SOP">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                รายการตรวจสอบความพร้อม (จำลองการติ๊กโดยพนักงาน)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {selectedSop.steps.map(step => (
                  <div 
                    key={step.id}
                    onClick={() => handleToggleStepMock(selectedSop.id, step.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1.2rem',
                      borderRadius: '12px',
                      background: step.checked ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid',
                      borderColor: step.checked ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-card)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      border: '2px solid',
                      borderColor: step.checked ? 'var(--accent-green)' : 'var(--text-muted)',
                      backgroundColor: step.checked ? 'var(--accent-green)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      {step.checked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span style={{
                      fontSize: '0.95rem',
                      textDecoration: step.checked ? 'line-through' : 'none',
                      color: step.checked ? 'var(--text-muted)' : 'var(--text-primary)',
                      transition: 'all var(--transition-fast)'
                    }}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-card)', paddingTop: '1.25rem' }}>
              <span>เป้าหมายพนักงาน: <strong>{selectedSop.targetStaff}</strong></span>
              <span>สร้างเมื่อ: {new Date(selectedSop.createdAt).toLocaleDateString('th-TH')}</span>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
            <ClipboardList size={48} strokeWidth={1.5} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
            <p>กรุณาเลือก SOP จากรายการ หรือกดสร้างใหม่</p>
          </div>
        )}
      </div>
    </div>
  );
}
