(function(app){
  const semesters = [
    { id:'7up', label:'七上之塔', short:'七上', color:'#ffd861', lobbyX:420, lobbyY:340 },
    { id:'7down', label:'七下之塔', short:'七下', color:'#7de7ff', lobbyX:900, lobbyY:340 },
    { id:'8up', label:'八上之塔', short:'八上', color:'#9bff8c', lobbyX:1380, lobbyY:340 },
    { id:'8down', label:'八下之塔', short:'八下', color:'#ff9dd6', lobbyX:420, lobbyY:820 },
    { id:'9up', label:'九上之塔', short:'九上', color:'#ffbd7a', lobbyX:900, lobbyY:820 },
    { id:'9down', label:'九下之塔', short:'九下', color:'#c3a5ff', lobbyX:1380, lobbyY:820 }
  ];

  const chapters = {
    '7up': [
      { id:'7up-1-1', floor:1, label:'1-1 負數與數線', subtitle:'10 題型混區史萊姆原野', implemented:true, bankKey:'chapter11', fieldTitle:'七上 1-1｜負數與數線', fieldHint:'同一張原野混合 10 題型史萊姆；同題型同色，晶角代表素養題。', theme:{sky:'#c9f7ff', grass:'#77d18a', path:'#d9c08a'} },
      { id:'7up-1-2', floor:2, label:'1-2 整數的加減', subtitle:'建置中', implemented:false },
      { id:'7up-1-3', floor:3, label:'1-3 整數乘除與四則運算', subtitle:'建置中', implemented:false },
      { id:'7up-1-4', floor:4, label:'1-4 指數記法與科學記號', subtitle:'建置中', implemented:false }
    ],
    '7down': [
      { id:'7down-1-1', floor:1, label:'1-1 二元一次方程式', subtitle:'6 題型混區史萊姆原野', implemented:true, bankKey:'chapter7d11', fieldTitle:'七下 1-1｜二元一次方程式', fieldHint:'同區可選多種題型史萊姆；標準題與素養題外觀分明。', theme:{sky:'#d4efff', grass:'#73c18a', path:'#d7b07a'} },
      { id:'7down-1-2', floor:2, label:'1-2 解二元一次聯立方程式', subtitle:'建置中', implemented:false },
      { id:'7down-1-3', floor:3, label:'1-3 二元一次方程式的圖形', subtitle:'建置中', implemented:false },
      { id:'7down-1-4', floor:4, label:'1-4 應用問題', subtitle:'建置中', implemented:false }
    ],
    '8up': [
      { id:'8up-1-1', floor:1, label:'1-1 平方根與近似值', subtitle:'預備中', implemented:false },
      { id:'8up-1-2', floor:2, label:'1-2 根式運算', subtitle:'預備中', implemented:false },
      { id:'8up-1-3', floor:3, label:'1-3 勾股定理', subtitle:'預備中', implemented:false },
      { id:'8up-1-4', floor:4, label:'1-4 畢氏定理應用', subtitle:'預備中', implemented:false }
    ],
    '8down': [
      { id:'8down-1-1', floor:1, label:'1-1 等差數列', subtitle:'6 題型混區史萊姆原野', implemented:true, bankKey:'chapter8d11', fieldTitle:'八下 1-1｜等差數列', fieldHint:'同一場景混合不同題型，便於直接選題與封測。', theme:{sky:'#d7f3ff', grass:'#89cf83', path:'#e0bf91'} },
      { id:'8down-1-2', floor:2, label:'1-2 等差級數', subtitle:'建置中', implemented:false },
      { id:'8down-1-3', floor:3, label:'1-3 幾何圖形與三視圖', subtitle:'建置中', implemented:false },
      { id:'8down-1-4', floor:4, label:'1-4 立體圖形', subtitle:'建置中', implemented:false }
    ],
    '9up': [
      { id:'9up-1-1', floor:1, label:'1-1 相似形', subtitle:'預備中', implemented:false },
      { id:'9up-1-2', floor:2, label:'1-2 圓與切線', subtitle:'預備中', implemented:false },
      { id:'9up-1-3', floor:3, label:'1-3 機率', subtitle:'預備中', implemented:false },
      { id:'9up-1-4', floor:4, label:'1-4 統計', subtitle:'預備中', implemented:false }
    ],
    '9down': [
      { id:'9down-1-1', floor:1, label:'1-1 二次函數', subtitle:'預備中', implemented:false },
      { id:'9down-1-2', floor:2, label:'1-2 二次函數圖形', subtitle:'預備中', implemented:false },
      { id:'9down-1-3', floor:3, label:'1-3 幾何綜合', subtitle:'預備中', implemented:false },
      { id:'9down-1-4', floor:4, label:'1-4 會考衝刺', subtitle:'預備中', implemented:false }
    ]
  };

  const bankByChapter = {
    '7up-1-1': 'chapter11',
    '7down-1-1': 'chapter7d11',
    '8down-1-1': 'chapter8d11'
  };

  app.data.world = {
    semesters,
    chapters,
    bankByChapter,

    getSemester(id){
      return semesters.find(item => item.id === id) || semesters[0];
    },

    getChapters(semesterId){
      return chapters[semesterId] || [];
    },

    getChapter(chapterId){
      return Object.values(chapters).flat().find(item => item.id === chapterId) || null;
    },

    getBank(chapterId){
      const key = bankByChapter[chapterId] || this.getChapter(chapterId)?.bankKey;
      return key ? app.data[key] : null;
    },

    getImplementedChapters(){
      return Object.values(chapters).flat().filter(item => item.implemented);
    },

    getFeedbackSlimeOptions(chapterId){
      const bank = this.getBank(chapterId);
      if (!bank || !bank.types) return [];
      return bank.types.map(item => ({ value:String(item.id), label:item.title }));
    }
  };
})(window.MathRPG);
