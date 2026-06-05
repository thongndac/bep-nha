import { useState, useEffect } from 'react'
import initialDishes from './data/dishes.json'
import './index.css'

// --- Gia vi filter (skip in shopping) ---
const giaViKeywords = [
  'tỏi', 'tiêu', 'sả', 'gừng', 'ớt', 'nghệ', 'quế', 'hoa hồi',
  'ngũ vị', 'mật ong', 'đường', 'nước mắm', 'dầu hào',
  'dầu ăn', 'bơ', 'giấm', 'me', 'tương', 'nước dừa', 'nước cốt dừa',
  'phô mai', 'hành tím', 'hành lá', 'hành phi', 'rau mùi', 'rau om',
  'rau răm', 'rau ngò', 'cần tây', 'mỡ hành', 'nước mắm chua ngọt'
]
const isGiaVi = (name) => giaViKeywords.some(kw => name.toLowerCase().includes(kw))

const shopCategories = {
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
  '🍜 Đồ khô & Khác': [
    'bún', 'hủ tíu', 'mì', 'nui', 'bánh', 'miến', 'gạo',
    'trứng', 'đậu hủ', 'đậu phộng', 'nấm', 'tôm khô', 'táo đỏ',
    'kỷ tử', 'bột', 'vỏ hoành', 'đồ chua', 'spaghetti', 'rau sống',
    'đồ tiềm'
  ]
}
const categorize = (name) => {
  const lower = name.toLowerCase()
  for (const [cat, keywords] of Object.entries(shopCategories)) {
    if (keywords.some(kw => lower.includes(kw))) return cat
  }
  return '📦 Khác'
}

// --- Helper: collect ingredients from dishes array, skip gia vi ---
function buildShoppingData(dishList) {
  const ingredientMap = {}
  dishList.forEach(dish => {
    if (dish?.ingredients) {
      dish.ingredients.forEach(ing => {
        if (isGiaVi(ing)) return
        const key = ing.toLowerCase().trim()
        if (!ingredientMap[key]) ingredientMap[key] = { name: ing, count: 0, dishes: [] }
        ingredientMap[key].count++
        if (!ingredientMap[key].dishes.includes(dish.name))
          ingredientMap[key].dishes.push(dish.name)
      })
    }
  })
  const grouped = {}
  Object.values(ingredientMap).forEach(item => {
    const cat = categorize(item.name)
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, 'vi')))
  return { ingredientMap, grouped }
}

function App() {
  const [activeTab, setActiveTab] = useState('generator')
  const [shoppingMode, setShoppingMode] = useState('weekly') // 'daily' | 'weekly'
  const [dishes, setDishes] = useState(() => {
    const saved = localStorage.getItem('menuAppDishes')
    if (saved) {
      const savedDishes = JSON.parse(saved)
      const ingredientMap = {}
      initialDishes.forEach(d => { ingredientMap[d.id] = d.ingredients })
      return savedDishes.map(d => ({
        ...d,
        ingredients: d.ingredients || ingredientMap[d.id] || []
      }))
    }
    return initialDishes
  })

  // Fridge state
  const [fridge, setFridge] = useState(() => {
    const saved = localStorage.getItem('bepnhaFridge')
    return saved ? JSON.parse(saved) : []
  })

  // Daily menu
  const [menuTrua, setMenuTrua] = useState({ MAN: null, CANH: null, RAU: null })
  const [menuChieu, setMenuChieu] = useState({ MAN: null, NUOC: null, isNuoc: false })
  const [weeklyMenu, setWeeklyMenu] = useState([])

  useEffect(() => {
    localStorage.setItem('menuAppDishes', JSON.stringify(dishes))
  }, [dishes])

  useEffect(() => {
    localStorage.setItem('bepnhaFridge', JSON.stringify(fridge))
  }, [fridge])

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
    if (filtered.length === 0) filtered = dishes.filter(d => d.type === type)
    if (filtered.length === 0) return null
    return filtered[Math.floor(Math.random() * filtered.length)]
  }

  // --- Daily Menu ---
  const generateDailyMenu = () => {
    const man1 = getRandomDish('MAN')
    setMenuTrua({ MAN: man1, CANH: getRandomDish('CANH'), RAU: getRandomDish('RAU') })
    setMenuChieu({ MAN: getRandomDish('MAN', man1?.id), NUOC: null, isNuoc: false })
  }

  const toggleChieuMode = () => {
    setMenuChieu(prev => {
      if (prev.isNuoc) return { MAN: getRandomDish('MAN', menuTrua.MAN?.id), NUOC: null, isNuoc: false }
      else return { MAN: null, NUOC: getRandomDish('NUOC'), isNuoc: true }
    })
  }

  const refreshDishTrua = (type) => {
    setMenuTrua(prev => ({ ...prev, [type]: getRandomDish(type, prev[type]?.id) }))
  }

  const refreshDishChieu = () => {
    if (menuChieu.isNuoc) setMenuChieu(prev => ({ ...prev, NUOC: getRandomDish('NUOC', prev.NUOC?.id) }))
    else setMenuChieu(prev => ({ ...prev, MAN: getRandomDish('MAN', prev.MAN?.id) }))
  }

  // --- Weekly Menu ---
  const generateWeeklyMenu = () => {
    const newWeek = []
    let historyIds = []
    const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
    const hasNuoc = dishes.some(d => d.type === 'NUOC')
    let nuocDays = new Set()
    if (hasNuoc) {
      const n = Math.random() < 0.5 ? 1 : 2
      while (nuocDays.size < n) nuocDays.add(Math.floor(Math.random() * 7))
    }
    for (let i = 0; i < 7; i++) {
      const truaMan = getRandomDishNotInHistory('MAN', historyIds)
      if (truaMan) historyIds.push(truaMan.id)
      const truaCanh = getRandomDishNotInHistory('CANH', historyIds)
      if (truaCanh) historyIds.push(truaCanh.id)
      const truaRau = getRandomDishNotInHistory('RAU', historyIds)
      if (truaRau) historyIds.push(truaRau.id)
      if (nuocDays.has(i)) {
        const chieuNuoc = getRandomDishNotInHistory('NUOC', historyIds)
        if (chieuNuoc) historyIds.push(chieuNuoc.id)
        newWeek.push({ dayName: daysOfWeek[i], trua: { MAN: truaMan, CANH: truaCanh, RAU: truaRau }, chieu: { isNuoc: true, NUOC: chieuNuoc, MAN: null } })
      } else {
        const chieuMan = getRandomDishNotInHistory('MAN', historyIds)
        if (chieuMan) historyIds.push(chieuMan.id)
        newWeek.push({ dayName: daysOfWeek[i], trua: { MAN: truaMan, CANH: truaCanh, RAU: truaRau }, chieu: { isNuoc: false, MAN: chieuMan, NUOC: null } })
      }
    }
    setWeeklyMenu(newWeek)
  }

  const swapWeeklyDish = (dayIdx, meal, type) => {
    setWeeklyMenu(prev => {
      const updated = [...prev]
      const day = { ...updated[dayIdx] }
      const usedIds = []
      prev.forEach(d => {
        if (d.trua.MAN) usedIds.push(d.trua.MAN.id)
        if (d.trua.CANH) usedIds.push(d.trua.CANH.id)
        if (d.trua.RAU) usedIds.push(d.trua.RAU.id)
        if (d.chieu.MAN) usedIds.push(d.chieu.MAN.id)
        if (d.chieu.NUOC) usedIds.push(d.chieu.NUOC.id)
      })
      const newDish = getRandomDishNotInHistory(type, usedIds)
      if (meal === 'trua') day.trua = { ...day.trua, [type]: newDish }
      else if (type === 'NUOC') day.chieu = { ...day.chieu, NUOC: newDish }
      else day.chieu = { ...day.chieu, MAN: newDish }
      updated[dayIdx] = day
      return updated
    })
  }

  // --- Fridge helpers ---
  const addToFridge = (items) => {
    setFridge(prev => {
      const set = new Set(prev.map(x => x.toLowerCase()))
      const newItems = items.filter(i => !isGiaVi(i) && !set.has(i.toLowerCase()))
      return [...prev, ...newItems]
    })
  }
  const removeFromFridge = (item) => {
    setFridge(prev => prev.filter(x => x.toLowerCase() !== item.toLowerCase()))
  }
  const clearFridge = () => setFridge([])

  // --- Daily dishes list ---
  const dailyDishes = [menuTrua.MAN, menuTrua.CANH, menuTrua.RAU, menuChieu.MAN, menuChieu.NUOC].filter(Boolean)

  return (
    <div className="app-container">
      <header>
        <h1>Hôm Nay Ăn Gì?</h1>
        <p>Gợi ý thực đơn siêu nhanh cho gia đình</p>
      </header>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`} onClick={() => setActiveTab('generator')}>1 Ngày</button>
        <button className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`} onClick={() => setActiveTab('weekly')}>1 Tuần</button>
        <button className={`tab-btn ${activeTab === 'shopping' ? 'active' : ''}`} onClick={() => setActiveTab('shopping')}>🛒 Đi Chợ</button>
        <button className={`tab-btn ${activeTab === 'fridge' ? 'active' : ''}`} onClick={() => setActiveTab('fridge')}>
          🧊 Tủ Lạnh{fridge.length > 0 && <span className="fridge-badge">{fridge.length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}>⚙️</button>
      </div>

      {/* ===== TAB 1 NGAY ===== */}
      {activeTab === 'generator' && (
        <div>
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

          <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn btn-secondary" onClick={generateDailyMenu} style={{flex: 1}}>
              🎲 Đổi Nguyên Ngày
            </button>
            <button className="btn" onClick={() => { setShoppingMode('daily'); setActiveTab('shopping') }} style={{flex: 1}}>
              ✅ Chốt → Đi Chợ
            </button>
          </div>
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
            <button className="btn" onClick={() => { setShoppingMode('weekly'); setActiveTab('shopping') }} style={{flex: 1}}>
              ✅ Chốt → Đi Chợ
            </button>
          </div>
        </div>
      )}

      {/* ===== TAB DI CHO ===== */}
      {activeTab === 'shopping' && (
        <ShoppingList
          mode={shoppingMode}
          setMode={setShoppingMode}
          dailyDishes={dailyDishes}
          weeklyMenu={weeklyMenu}
          addToFridge={addToFridge}
        />
      )}

      {/* ===== TAB TU LANH ===== */}
      {activeTab === 'fridge' && (
        <FridgeTab
          fridge={fridge}
          removeFromFridge={removeFromFridge}
          clearFridge={clearFridge}
          dishes={dishes}
        />
      )}

      {/* ===== TAB QUAN LY ===== */}
      {activeTab === 'manage' && (
        <DishManager dishes={dishes} setDishes={setDishes} />
      )}
    </div>
  )
}

// ===================== SHOPPING LIST =====================
function ShoppingList({ mode, setMode, dailyDishes, weeklyMenu, addToFridge }) {
  const [checked, setChecked] = useState({})

  // Collect dishes based on mode
  let allDishes = []
  if (mode === 'daily') {
    allDishes = dailyDishes
  } else {
    weeklyMenu.forEach(day => {
      if (day.trua.MAN) allDishes.push(day.trua.MAN)
      if (day.trua.CANH) allDishes.push(day.trua.CANH)
      if (day.trua.RAU) allDishes.push(day.trua.RAU)
      if (day.chieu.MAN) allDishes.push(day.chieu.MAN)
      if (day.chieu.NUOC) allDishes.push(day.chieu.NUOC)
    })
  }

  const { ingredientMap, grouped } = buildShoppingData(allDishes)

  const toggle = (name) => setChecked(prev => ({ ...prev, [name]: !prev[name] }))
  const clearAll = () => setChecked({})

  const allIngredientNames = Object.values(ingredientMap).filter(i => !isGiaVi(i.name)).map(i => i.name)
  const checkedItems = allIngredientNames.filter(name => checked[name])
  const totalItems = allIngredientNames.length
  const checkedCount = checkedItems.length

  const handleAddToFridge = () => {
    if (checkedItems.length === 0) return
    addToFridge(checkedItems)
    setChecked({})
    alert(`Đã cho ${checkedItems.length} nguyên liệu vào tủ lạnh! 🧊`)
  }

  if (allDishes.length === 0) {
    return (
      <div className="glass-card">
        <h2 style={{marginTop: 0, textAlign: 'center'}}>🛒 Danh sách đi chợ</h2>
        <p style={{textAlign: 'center', color: '#999'}}>Hãy tạo thực đơn trước nhé!</p>
      </div>
    )
  }

  return (
    <div className="glass-card">
      <div className="shopping-header">
        <h2 style={{marginTop: 0}}>🛒 Đi Chợ</h2>
        <span className="shopping-progress">{checkedCount}/{totalItems} ✓</span>
      </div>

      {/* Mode toggle */}
      <div className="shop-mode-toggle">
        <button className={`shop-mode-btn ${mode === 'daily' ? 'active' : ''}`} onClick={() => { setMode('daily'); setChecked({}) }}>
          1 Ngày
        </button>
        <button className={`shop-mode-btn ${mode === 'weekly' ? 'active' : ''}`} onClick={() => { setMode('weekly'); setChecked({}) }}>
          1 Tuần
        </button>
      </div>

      <p style={{color: '#999', fontSize: '13px', marginTop: '8px'}}>
        {mode === 'daily' ? `Hôm nay: ${allDishes.length} món` : `Cả tuần: ${allDishes.length} món`}
      </p>

      {checkedCount > 0 && (
        <div style={{display: 'flex', gap: '8px', marginBottom: '15px'}}>
          <button className="btn btn-secondary" onClick={clearAll} style={{flex: 1, padding: '8px 12px', fontSize: '13px'}}>
            Bỏ chọn tất cả
          </button>
          <button className="btn" onClick={handleAddToFridge} style={{flex: 1, padding: '8px 12px', fontSize: '13px'}}>
            🧊 Cho vào tủ lạnh ({checkedCount})
          </button>
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="shop-group">
          <div className="shop-group-title">{cat}</div>
          {items.map(item => (
            <label key={item.name} className={`shop-item ${checked[item.name] ? 'shop-checked' : ''}`}>
              <input type="checkbox" checked={!!checked[item.name]} onChange={() => toggle(item.name)} />
              <span className="shop-name">{item.name}</span>
              {item.count > 1 && <span className="shop-count">×{item.count} món</span>}
            </label>
          ))}
        </div>
      ))}
    </div>
  )
}

// ===================== FRIDGE TAB =====================
function FridgeTab({ fridge, removeFromFridge, clearFridge, dishes }) {
  // Find dishes that can be made from fridge ingredients
  const fridgeLower = new Set(fridge.map(x => x.toLowerCase()))

  const suggestions = dishes
    .filter(dish => dish.ingredients && dish.ingredients.length > 0)
    .map(dish => {
      const needed = dish.ingredients.filter(ing => !isGiaVi(ing))
      if (needed.length === 0) return null
      const have = needed.filter(ing => fridgeLower.has(ing.toLowerCase()))
      const missing = needed.filter(ing => !fridgeLower.has(ing.toLowerCase()))
      const percent = Math.round((have.length / needed.length) * 100)
      return { dish, needed, have, missing, percent }
    })
    .filter(s => s && s.have.length > 0)
    .sort((a, b) => b.percent - a.percent || a.missing.length - b.missing.length)

  const fullMatch = suggestions.filter(s => s.percent === 100)
  const partialMatch = suggestions.filter(s => s.percent > 0 && s.percent < 100).slice(0, 10)

  const typeEmojis = { MAN: '🥩', CANH: '🥣', RAU: '🥗', NUOC: '🍜' }

  return (
    <div>
      {/* Fridge contents */}
      <div className="glass-card">
        <div className="shopping-header">
          <h2 style={{marginTop: 0}}>🧊 Tủ lạnh</h2>
          <span className="shopping-progress">{fridge.length} món</span>
        </div>

        {fridge.length === 0 ? (
          <p style={{color: '#999', textAlign: 'center', padding: '20px 0'}}>
            Tủ lạnh trống!<br/>Đi chợ xong hãy check nguyên liệu để cho vào đây.
          </p>
        ) : (
          <>
            <div className="fridge-items">
              {fridge.map(item => (
                <div key={item} className="fridge-item">
                  <span>{item}</span>
                  <button className="fridge-remove" onClick={() => removeFromFridge(item)}>✕</button>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" onClick={clearFridge} style={{marginTop: '10px', fontSize: '13px', padding: '8px 16px'}}>
              🗑️ Xóa hết tủ lạnh
            </button>
          </>
        )}
      </div>

      {/* Dish suggestions */}
      {fridge.length > 0 && (
        <div className="glass-card">
          <h2 style={{marginTop: 0}}>💡 Gợi ý món ăn</h2>
          <p style={{color: '#999', fontSize: '13px', marginTop: 0}}>Từ nguyên liệu có trong tủ lạnh</p>

          {fullMatch.length > 0 && (
            <div className="suggest-section">
              <div className="suggest-label suggest-full">✅ Đủ nguyên liệu — nấu ngay!</div>
              {fullMatch.map(s => (
                <div key={s.dish.id} className="suggest-dish suggest-dish-full">
                  <span className="suggest-emoji">{typeEmojis[s.dish.type] || '🍽️'}</span>
                  <div className="suggest-info">
                    <span className="suggest-name">{s.dish.name}</span>
                    <span className="suggest-ings">Cần: {s.needed.join(', ')}</span>
                  </div>
                  <span className="suggest-percent full">100%</span>
                </div>
              ))}
            </div>
          )}

          {partialMatch.length > 0 && (
            <div className="suggest-section">
              <div className="suggest-label">🔶 Thiếu vài nguyên liệu</div>
              {partialMatch.map(s => (
                <div key={s.dish.id} className="suggest-dish">
                  <span className="suggest-emoji">{typeEmojis[s.dish.type] || '🍽️'}</span>
                  <div className="suggest-info">
                    <span className="suggest-name">{s.dish.name}</span>
                    <span className="suggest-ings">
                      Có: {s.have.join(', ')}
                      {s.missing.length > 0 && <> · <em style={{color: '#e65100'}}>Thiếu: {s.missing.join(', ')}</em></>}
                    </span>
                  </div>
                  <span className="suggest-percent">{s.percent}%</span>
                </div>
              ))}
            </div>
          )}

          {fullMatch.length === 0 && partialMatch.length === 0 && (
            <p style={{textAlign: 'center', color: '#999'}}>Không tìm thấy món nào phù hợp.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ===================== DISH MANAGER =====================
function DishManager({ dishes, setDishes }) {
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('MAN')

  const addDish = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setDishes([{ id: Date.now(), name: newName, type: newType, ingredients: [] }, ...dishes])
    setNewName('')
  }

  const deleteDish = (id) => setDishes(dishes.filter(d => d.id !== id))

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
        <input placeholder="Tên món ăn mới..." value={newName} onChange={e => setNewName(e.target.value)} />
        <select value={newType} onChange={e => setNewType(e.target.value)}>
          {typeOrder.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
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

export default App
