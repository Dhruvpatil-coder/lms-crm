import os, sys

replacements = [
    ('frontend/src/pages/trainer/TrainerDailyTracker.jsx', [
        ("new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })", "(() => { const d = new Date(); const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const months = ['January','February','March','April','May','June','July','August','September','October','November','December']; return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear(); })()"),
        ("time.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })", "(String(time.getHours()).padStart(2,'0') + ':' + String(time.getMinutes()).padStart(2,'0') + ':' + String(time.getSeconds()).padStart(2,'0'))"),
        ("time.toLocaleDateString('en-IN', { weekday:'long' })", "(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][time.getDay()])"),
        ("new Date(r.date).toLocaleDateString('en-IN',{weekday:'short'})", "(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(r.date).getDay()])"),
        ("new Date(r.date).toLocaleDateString('en-IN',{month:'short'})", "(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(r.date).getMonth()])"),
        ("r.checkinTime ? new Date(r.checkinTime).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—'", "r.checkinTime ? (String(new Date(r.checkinTime).getHours()).padStart(2,'0') + ':' + String(new Date(r.checkinTime).getMinutes()).padStart(2,'0')) : '—'"),
        ("r.checkoutTime ? new Date(r.checkoutTime).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—'", "r.checkoutTime ? (String(new Date(r.checkoutTime).getHours()).padStart(2,'0') + ':' + String(new Date(r.checkoutTime).getMinutes()).padStart(2,'0')) : '—'"),
    ]),
    ('frontend/src/pages/trainer/TrainerBatches.jsx', [
        ("new Date(b.startDate).toLocaleDateString('en-IN')", "(String(new Date(b.startDate).getDate()).padStart(2,'0') + '/' + String(new Date(b.startDate).getMonth()+1).padStart(2,'0') + '/' + new Date(b.startDate).getFullYear())"),
        ("new Date(b.endDate).toLocaleDateString('en-IN')", "(String(new Date(b.endDate).getDate()).padStart(2,'0') + '/' + String(new Date(b.endDate).getMonth()+1).padStart(2,'0') + '/' + new Date(b.endDate).getFullYear())"),
    ]),
    ('frontend/src/pages/trainer/TrainerCandidates.jsx', [
        ("new Date(h.followupDate).toLocaleDateString('en-IN')", "(String(new Date(h.followupDate).getDate()).padStart(2,'0') + '/' + String(new Date(h.followupDate).getMonth()+1).padStart(2,'0') + '/' + new Date(h.followupDate).getFullYear())"),
        ("new Date(h.nextFollowupDate).toLocaleDateString('en-IN')", "(String(new Date(h.nextFollowupDate).getDate()).padStart(2,'0') + '/' + String(new Date(h.nextFollowupDate).getMonth()+1).padStart(2,'0') + '/' + new Date(h.nextFollowupDate).getFullYear())"),
    ]),
    ('frontend/src/components/shared/VideoCard.jsx', [
        ("new Date(session.sessionDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })", "(String(new Date(session.sessionDate).getDate()).padStart(2,'0') + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(session.sessionDate).getMonth()] + ' ' + new Date(session.sessionDate).getFullYear())"),
    ]),
    ('frontend/src/pages/admin/AdminTrainerMonitoring.jsx', [
        ("const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : null;", "const fmtTime = (ts) => ts ? (String(new Date(ts).getHours()).padStart(2,'0') + ':' + String(new Date(ts).getMinutes()).padStart(2,'0')) : null;"),
        ("new Date().toLocaleDateString('en-IN')", "(String(new Date().getDate()).padStart(2,'0') + '/' + String(new Date().getMonth()+1).padStart(2,'0') + '/' + new Date().getFullYear())"),
        ("r.date ? new Date(r.date).toLocaleDateString('en-IN') : '—'", "r.date ? (String(new Date(r.date).getDate()).padStart(2,'0') + '/' + String(new Date(r.date).getMonth()+1).padStart(2,'0') + '/' + new Date(r.date).getFullYear()) : '—'"),
    ]),
    ('frontend/src/pages/trainer/TrainerPlacementDashboard.jsx', [
        ("new Date(f.startDate).toLocaleDateString('en-IN')", "(String(new Date(f.startDate).getDate()).padStart(2,'0') + '/' + String(new Date(f.startDate).getMonth()+1).padStart(2,'0') + '/' + new Date(f.startDate).getFullYear())"),
    ]),
    ('frontend/src/pages/hr/SchedulePage.jsx', [
        ("const fmtTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';", "const fmtTime = (dt) => dt ? (String(new Date(dt).getHours()).padStart(2,'0') + ':' + String(new Date(dt).getMinutes()).padStart(2,'0')) : '';"),
        ("const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';", "const fmtDate = (dt) => dt ? (String(new Date(dt).getDate()).padStart(2,'0') + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(dt).getMonth()] + ' ' + new Date(dt).getFullYear()) : '';"),
        ("new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })", "(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(selectedDate).getDay()] + ', ' + new Date(selectedDate).getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(selectedDate).getMonth()])"),
    ]),
]

for filepath, pairs in replacements:
    fullpath = os.path.join('C:', 'Users', 'dhruv', 'OneDrive', 'Documents', 'Git hub', 'lms-crm-complete.tar', 'lms-crm', filepath)
    if not os.path.exists(fullpath):
        print('SKIP:', filepath)
        continue
    with open(fullpath, 'r', encoding='utf-8') as f:
        content = f.read()
    changed = False
    for old, new in pairs:
        if old in content:
            content = content.replace(old, new)
            changed = True
            print('FIXED:', filepath, '->', old[:60])
    if changed:
        with open(fullpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print('  SAVED:', filepath)
    else:
        print('  OK:', filepath)

print('Done!')
