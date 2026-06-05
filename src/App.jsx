import { useState, useEffect } from 'react'
import initialDishes from './data/dishes.json'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('generator') // generator | weekly | shopping | manage
  const [dishes, setDishes] = useState(() => {
    const saved = localStorage.getItem('menuAppDishes')
    if (saved) return JSON.parse(saved)
    return initialDishes
  })

  // Daily menu: 2 bua
  const [menuTrua, setMenuTrua] = useState({ MAN: null, CANH: null, RAU: null })
  const [menuChieu, setMenuChieu] = useState({ MAN: null, NUOC: null, isNuoc: false })
  const [weeklyMenu, setWeeklyMenu] = useState([])
  
  useEffect(() => {
    localStorage.setItem('menuAppDishes', JSON.stringify(dishes))
  }, [dishes])

  useEffect(() => {
    generateDailyMenu()
    generateWeeklyMenu()
  }, [])

  // --- Random helpers ---
  const getRandomDish = (type, excludeId = null) => {
    const filtered = dishes.filter(d => d.type === type && d.id !== excludeId)
    if (filtered.length === 0) return null
    return filtered[Math.floor(Math.random() * filtered.length)]
  }

  const getRandomDishNotInHistory = (type, historyIds) => {
    let filtered = dishes.filter(d => d.type === type && !historyIds.includes(d.id))
    if (filtered.length === 0) {
      filtered = dishes.filter(d => d.type === type)
    }
    if (filtered.length === 0) return null
    return filtered[Math.floor(Math.random() * filtered.length)]
  }

  // --- Daily Menu ---
  const generateDailyMenu = () => {
    const man1 = getRandomDish('MAN')
    setMenuTrua({
      MAN: man1,
      CANH: getRandomDish('CANH'),
      RAU: getRandomDish('RAU')
    })
    setMenuChieu({
      MAN: getRandomDish('MAN', man1?.id),
      NUOC: null,
      isNuoc: false
    })
  }

  const toggleChieuMode = () => {
    setMenuChieu(prev => {
      if (prev.isNuoc) {
        // Switch to com
        return { MAN: getRandomDish('MAN', menuTrua.MAN?.id), NUOC: null, isNuoc: false }
      } else {
        // Switch to nuoc
        return { MAN: null, NUOC: getRandomDish('NUOC'), isNuoc: true }
      }
    })
  }

  const refreshDishTrua = (type) => {
    setMenuTrua(prev => ({
      ...prev,
      [type]: getRandomDish(type, prev[type]?.id)
    }))
  }

  const refreshDishChieu = () => {
    if (menuChieu.isNuoc) {
      setMenuChieu(prev => ({ ...prev, NUOC: getRandomDish('NUOC', prev.NUOC?.id) }))
    } else {
      setMenuChieu(prev => ({ ...prev, MAN: getRandomDish('MAN', prev.MAN?.id) }))
    }
  }

  // --- Weekly Menu ---
  const generateWeeklyMenu = () => {
    const newWeek = []
    let historyIds = []
    const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']

    // Random 1-2 ngay "doi bua" chieu = mon nuoc
    const hasNuoc = dishes.some(d => d.type === 'NUOC')
    let nuocDays = new Set()
    if (hasNuoc) {
      const numNuocDays = Math.random() < 0.5 ? 1 : 2
      while (nuocDays.size < numNuocDays) {
        nuocDays.add(Math.floor(Math.random() * 7))
      }
    }

    for (let i = 0; i < 7; i++) {
      // Bua trua luon la com: MAN + CANH + RAU
      const truaMan = getRandomDishNotInHistory('MAN', historyIds)
      if (truaMan) historyIds.push(truaMan.id)
      const truaCanh = getRandomDishNotInHistory('CANH', historyIds)
      if (truaCanh) historyIds.push(truaCanh.id)
      const truaRau = getRandomDishNotInHistory('RAU', historyIds)
      if (truaRau) historyIds.push(truaRau.id)

      if (nuocDays.has(i)) {
        // Chieu = mon nuoc
        const chieuNuoc = getRandomDishNotInHistory('NUOC', historyIds)
        if (chieuNuoc) historyIds.push(chieuNuoc.id)
        newWeek.push({
          dayName: daysOfWeek[i],
          trua: { MAN: truaMan, CANH: truaCanh, RAU: truaRau },
          chieu: { isNuoc: true, NUOC: chieuNuoc, MAN: null }
        })
      } else {
        // Chieu = mon man khac
        const chieuMan = getRandomDishNotInHistory('MAN', historyIds)
        if (chieuMan) historyIds.push(chieuMan.id)
        newWeek.push({
          dayName: daysOfWeek[i],
          trua: { MAN: truaMan, CANH: truaCanh, RAU: truaRau },
          chieu: { isNuoc: false, MAN: chieuMan, NUOC: null }
        })
      }
    }
    setWeeklyMenu(newWeek)
  }

  // Swap a single dish in weekly menu
  const swapWeeklyDish = (dayIdx, meal, type) => {
    setWeeklyMenu(prev => {
      const updated = [...prev]
      const day = { ...updated[dayIdx] }

      // Collect all IDs currently in weekly menu to avoid duplicates
      const usedIds = []
      prev.forEach(d => {
        if (d.trua.MAN) usedIds.push(d.trua.MAN.id)
        if (d.trua.CANH) usedIds.push(d.trua.CANH.id)
        if (d.trua.RAU) usedIds.push(d.trua.RAU.id)
        if (d.chieu.MAN) usedIds.push(d.chieu.MAN.id)
        if (d.chieu.NUOC) usedIds.push(d.chieu.NUOC.id)
      })

      const newDish = getRandomDishNotInHistory(type, usedIds)

      if (meal === 'trua') {
        day.trua = { ...day.trua, [type]: newDish }
      } else {
        if (type === 'NUOC') {
          day.chieu = { ...day.chieu, NUOC: newDish }
        } else {
          day.chieu = { ...day.chieu, MAN: newDish }
        }
      }
      updated[dayIdx] = day
      return updated
    })
  }

  return (
    <div className="app-container">
      <header>
        <h1>Hôm Nay Ăn Gì?</h1>
        <p>Gợi ý thực đơn siêu nhanh cho gia đình</p>
      </header>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          1 Ngày
        </button>
        <button 
          className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          1 Tuần
        </button>
        <button 
          className={`tab-btn ${activeTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          🛒 Đi Chợ
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Tủ Món Ăn
        </button>
      </div>

      {/* ===== TAB 1 NGAY ===== */}
      {activeTab === 'generator' && (
        <div>
          {/* Bua Trua */}
          <div className="glass-card">
            <h2 className="bua-title">☀️ Bữa Trưa</h2>

            <div className="meal-item">
              <span className="meal-type type-MAN">MẶN</span>
              <span className="meal-name">{menuTrua.MAN?.name || "Chưa có món"}</span>
              <button className="refresh-btn" onClick={() => refreshDishTrua('MAN')}>🔄</button>
            </div>

            <div className="meal-item">
              <span className="meal-type type-RAU">XÀO/LUỘC</span>
              <span className="meal-name">{menuTrua.RAU?.name || "Chưa có món"}</span>
              <button className="refresh-btn" onClick={() => refreshDishTrua('RAU')}>🔄</button>
            </div>

            <div className="meal-item">
              <span className="meal-type type-CANH">CANH</span>
              <span className="meal-name">{menuTrua.CANH?.name || "Chưa có món"}</span>
              <button className="refresh-btn" onClick={() => refreshDishTrua('CANH')}>🔄</button>
            </div>
          </div>

          {/* Bua Chieu */}
          <div className={`glass-card ${menuChieu.isNuoc ? 'card-nuoc' : ''}`}>
            <div className="chieu-header">
              <h2 className="bua-title">🌙 Bữa Chiều</h2>
              <button className="mode-switch" onClick={toggleChieuMode}>
                {menuChieu.isNuoc ? '🍚 Đổi sang Cơm' : '🍜 Đổi sang Nước'}
              </button>
            </div>

            {menuChieu.isNuoc ? (
              <div className="meal-item nuoc-highlight">
                <span className="meal-type type-NUOC">NƯỚC/SỢI</span>
                <span className="meal-name">{menuChieu.NUOC?.name || "Chưa có món nước"}</span>
                <button className="refresh-btn" onClick={refreshDishChieu}>🔄</button>
              </div>
            ) : (
              <div className="meal-item">
                <span className="meal-type type-MAN">MẶN</span>
                <span className="meal-name">{menuChieu.MAN?.name || "Chưa có món"}</span>
                <button className="refresh-btn" onClick={refreshDishChieu}>🔄</button>
              </div>
            )}
          </div>

          <button className="btn" onClick={generateDailyMenu}>
            🎲 Đổi Nguyên Ngày
          </button>
        </div>
      )}

      {/* ===== TAB 1 TUAN ===== */}
      {activeTab === 'weekly' && (
        <div className="glass-card">
          <h2 style={{marginTop: 0, textAlign: 'center'}}>Thực đơn cả tuần</h2>
          <p style={{textAlign: 'center', color: '#999', fontSize: '13px', marginTop: 0}}>Bấm 🔄 để đổi từng món</p>
          
          <div className="weekly-scroll">
            {weeklyMenu.map((day, idx) => (
              <div key={idx} className={`weekly-day ${day.chieu.isNuoc ? 'weekly-has-nuoc' : ''}`}>
                <h3 className="weekly-day-title">
                  {day.dayName}
                  {day.chieu.isNuoc && <span className="nuoc-badge">Đổi bữa chiều</span>}
                </h3>

                {/* Trua */}
                <div className="weekly-bua-label">☀️ Trưa</div>
                <div className="weekly-dish-row">
                  <span className="weekly-dish">🥩 {day.trua.MAN?.name || "—"}</span>
                  <button className="swap-btn" onClick={() => swapWeeklyDish(idx, 'trua', 'MAN')}>🔄</button>
                </div>
                <div className="weekly-dish-row">
                  <span className="weekly-dish">🥗 {day.trua.RAU?.name || "—"}</span>
                  <button className="swap-btn" onClick={() => swapWeeklyDish(idx, 'trua', 'RAU')}>🔄</button>
                </div>
                <div className="weekly-dish-row">
                  <span className="weekly-dish">🥣 {day.trua.CANH?.name || "—"}</span>
                  <button className="swap-btn" onClick={() => swapWeeklyDish(idx, 'trua', 'CANH')}>🔄</button>
                </div>

                {/* Chieu */}
                <div className="weekly-bua-label" style={{marginTop: '6px'}}>🌙 Chiều</div>
                {day.chieu.isNuoc ? (
                  <div className="weekly-dish-row">
                    <span className="weekly-dish nuoc-text">🍜 {day.chieu.NUOC?.name || "—"}</span>
                    <button className="swap-btn" onClick={() => swapWeeklyDish(idx, 'chieu', 'NUOC')}>🔄</button>
                  </div>
                ) : (
                  <div className="weekly-dish-row">
                    <span className="weekly-dish">🥩 {day.chieu.MAN?.name || "—"}</span>
                    <button className="swap-btn" onClick={() => swapWeeklyDish(idx, 'chieu', 'MAN')}>🔄</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
            <button className="btn btn-secondary" onClick={generateWeeklyMenu} style={{flex: 1}}>
              🎲 Đổi Cả Tuần
            </button>
            <button className="btn" onClick={() => setActiveTab('shopping')} style={{flex: 1}}>
              ✅ Chốt → Đi Chợ
            </button>
          </div>
        </div>
      )}

      {/* ===== TAB DI CHO ===== */}
      {activeTab === 'shopping' && (
        <ShoppingList weeklyMenu={weeklyMenu} />
      )}

      {/* ===== TAB QUAN LY ===== */}
      {activeTab === 'manage' && (
        <DishManager dishes={dishes} setDishes={setDishes} />
      )}
    </div>
  )
}

function DishManager({ dishes, setDishes }) {
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('MAN')

  const addDish = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    const newDish = {
      id: Date.now(),
      name: newName,
      type: newType
    }
    setDishes([newDish, ...dishes])
    setNewName('')
  }

  const deleteDish = (id) => {
    setDishes(dishes.filter(d => d.id !== id))
  }

  const resetToDefault = () => {
    if (window.confirm('Khôi phục lại danh sách gốc? Các món bạn thêm thủ công sẽ bị xóa.')) {
      setDishes(initialDishes)
    }
  }

  const typeLabels = { MAN: 'Mặn', CANH: 'Canh', RAU: 'Rau/Xào', NUOC: 'Nước/Sợi' }
  const typeOrder = ['MAN', 'CANH', 'RAU', 'NUOC']

  return (
    <div className="glass-card">
      <h2 style={{marginTop: 0}}>Quản lý Món Ăn ({dishes.length})</h2>
      
      <form className="add-dish-form" onSubmit={addDish}>
        <input 
          placeholder="Tên món ăn mới..." 
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <select value={newType} onChange={e => setNewType(e.target.value)}>
          {typeOrder.map(t => (
            <option key={t} value={t}>{typeLabels[t]}</option>
          ))}
        </select>
        <button type="submit" className="btn" style={{width: 'auto'}}>Thêm</button>
      </form>

      <div className="dish-list">
        {typeOrder.map(type => {
          const group = dishes.filter(d => d.type === type)
          if (group.length === 0) return null
          return (
            <div key={type} style={{marginBottom: '10px'}}>
              <div className="dish-group-header">
                <span className={`meal-type type-${type}`}>{typeLabels[type]}</span>
                <span className="dish-group-count">{group.length} món</span>
              </div>
              {group.map(dish => (
                <div key={dish.id} className="dish-row">
                  <span>{dish.name}</span>
                  <button className="refresh-btn" style={{color: 'red'}} onClick={() => deleteDish(dish.id)}>🗑️</button>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <button className="btn btn-secondary" onClick={resetToDefault} style={{marginTop: '15px'}}>
        ♻️ Khôi phục danh sách gốc
      </button>
    </div>
  )
}

function ShoppingList({ weeklyMenu }) {
  const [checked, setChecked] = useState({})

  // Collect all dishes from weekly menu
  const allDishes = []
  weeklyMenu.forEach(day => {
    if (day.trua.MAN) allDishes.push(day.trua.MAN)
    if (day.trua.CANH) allDishes.push(day.trua.CANH)
    if (day.trua.RAU) allDishes.push(day.trua.RAU)
    if (day.chieu.MAN) allDishes.push(day.chieu.MAN)
    if (day.chieu.NUOC) allDishes.push(day.chieu.NUOC)
  })

  // Aggregate ingredients, count occurrences
  const ingredientMap = {}
  allDishes.forEach(dish => {
    if (dish.ingredients) {
      dish.ingredients.forEach(ing => {
        const key = ing.toLowerCase().trim()
        if (!ingredientMap[key]) {
          ingredientMap[key] = { name: ing, count: 0, dishes: [] }
        }
        ingredientMap[key].count++
        if (!ingredientMap[key].dishes.includes(dish.name)) {
          ingredientMap[key].dishes.push(dish.name)
        }
      })
    }
  })

  // Group by category
  const categories = {
    '🥩 Thịt & Cá & Hải sản': [
      'thịt', 'bò', 'heo', 'gà', 'vịt', 'ếch', 'cá', 'mực', 'tôm', 'lươn',
      'sườn', 'giò', 'chân gà', 'cánh gà', 'đùi gà', 'xương', 'bò viên'
    ],
    '🥬 Rau & Củ & Trái': [
      'rau', 'cải', 'bông cải', 'mướp', 'bí', 'khổ qua', 'cà ', 'khoai',
      'cà rốt', 'hành tây', 'ớt chuông', 'đậu que', 'dưa leo', 'giá',
      'bạc hà', 'thơm', 'đu đủ', 'bắp ngô', 'xà lách', 'đậu bắp',
      'củ cải', 'chanh'
    ],
    '🧄 Gia vị & Nước chấm': [
      'tỏi', 'tiêu', 'sả', 'gừng', 'ớt', 'nghệ', 'quế', 'hoa hồi',
      'ngũ vị', 'cà ri', 'mật ong', 'đường', 'nước mắm', 'dầu hào',
      'dầu ăn', 'bơ', 'giấm', 'me', 'tương', 'nước dừa', 'nước cốt dừa',
      'phô mai', 'hành tím', 'hành lá', 'hành phi', 'rau mùi', 'rau om',
      'rau răm', 'rau ngò', 'cần tây', 'mỡ hành', 'nước mắm chua ngọt'
    ],
    '🍜 Đồ khô & Khác': [
      'bún', 'hủ tíu', 'mì', 'nui', 'bánh', 'miến', 'gạo',
      'trứng', 'đậu hủ', 'đậu phộng', 'nấm', 'tôm khô', 'táo đỏ',
      'kỷ tử', 'bột', 'vỏ hoành', 'đồ chua', 'spaghetti', 'rau sống'
    ]
  }

  const categorize = (name) => {
    const lower = name.toLowerCase()
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lower.includes(kw))) return cat
    }
    return '📦 Khác'
  }

  // Build grouped list
  const grouped = {}
  Object.values(ingredientMap).forEach(item => {
    const cat = categorize(item.name)
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })

  // Sort each group alphabetically
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, 'vi')))

  const toggle = (name) => {
    setChecked(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const clearAll = () => setChecked({})

  const totalItems = Object.keys(ingredientMap).length
  const checkedCount = Object.values(checked).filter(Boolean).length

  if (weeklyMenu.length === 0) {
    return (
      <div className="glass-card">
        <h2 style={{marginTop: 0, textAlign: 'center'}}>🛒 Danh sách đi chợ</h2>
        <p style={{textAlign: 'center', color: '#999'}}>Hãy tạo thực đơn tuần trước nhé!</p>
      </div>
    )
  }

  return (
    <div className="glass-card">
      <div className="shopping-header">
        <h2 style={{marginTop: 0}}>🛒 Danh sách đi chợ</h2>
        <span className="shopping-progress">
          {checkedCount}/{totalItems} ✓
        </span>
      </div>
      <p style={{color: '#999', fontSize: '13px', marginTop: 0}}>
        Tổng hợp từ thực đơn tuần ({allDishes.length} món)
      </p>

      {checkedCount > 0 && (
        <button className="btn btn-secondary" onClick={clearAll} style={{marginBottom: '15px', padding: '8px 16px', fontSize: '13px'}}>
          Bỏ tất cả dấu ✓
        </button>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="shop-group">
          <div className="shop-group-title">{cat}</div>
          {items.map(item => (
            <label
              key={item.name}
              className={`shop-item ${checked[item.name] ? 'shop-checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={!!checked[item.name]}
                onChange={() => toggle(item.name)}
              />
              <span className="shop-name">{item.name}</span>
              {item.count > 1 && (
                <span className="shop-count">×{item.count} món</span>
              )}
            </label>
          ))}
        </div>
      ))}
    </div>
  )
}

export default App
