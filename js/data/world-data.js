
(function(app){
  const semesters = [
    { id:'7up', label:'七上之塔', short:'七上', color:'#ffcf52', lobbyX:330, lobbyY:620 },
    { id:'7down', label:'七下之塔', short:'七下', color:'#6dd8ff', lobbyX:610, lobbyY:620 },
    { id:'8up', label:'八上之塔', short:'八上', color:'#94e572', lobbyX:1210, lobbyY:620 },
    { id:'8down', label:'八下之塔', short:'八下', color:'#ff94c9', lobbyX:1490, lobbyY:620 },
    { id:'9up', label:'九上之塔', short:'九上', color:'#ffb66f', lobbyX:760, lobbyY:270 },
    { id:'9down', label:'九下之塔', short:'九下', color:'#b69aff', lobbyX:1040, lobbyY:270 }
  ];

  function chapter(id, label, subtitle, implemented=false, bankKey=null, extra={}){
    const parts = id.split('-');
    const unit = Number(parts[1]);
    const slot = Number(parts[2]);
    return Object.assign({
      id,
      floor: unit,
      slot,
      label,
      subtitle,
      implemented,
      bankKey,
      fieldTitle: `${id.replace(/^[^-]+-/, '').replace('-', '-')}｜${label.replace(/^\d-\d\s*/, '')}`,
      fieldHint: '同區可挑不同題型怪物；靠近按 E 開戰，答對領獎後回原野。'
    }, extra);
  }

  function makePlaceholderSemester(prefix, overrides={}){
    const list = [];
    [['1-1','1-2','1-3','1-4'], ['2-1','2-2','2-3','2-4'], ['3-1','3-2','3-3']].forEach((group) => {
      group.forEach((code) => {
        const id = `${prefix}-${code}`;
        const found = overrides[id];
        if (found) {
          list.push(found);
        } else {
          list.push(chapter(id, `${code} 建置中`, '建置中', false, null));
        }
      });
    });
    return list;
  }

  const chapters = {
    '7up': [
      chapter('7up-1-1', '1-1 負數與數線', '10 題型混區史萊姆原野', true, 'chapter11', {
        fieldTitle:'七上 1-1｜負數與數線',
        fieldHint:'10 種題型怪物混在同一張原野；同題型同色，不同種族輪替，晶角代表素養題。',
        theme:{sky:'#c9f7ff', grass:'#77d18a', path:'#d9c08a'}
      }),
      chapter('7up-1-2', '1-2 整數的加減', '建置中', false, null),
      chapter('7up-1-3', '1-3 整數乘除與四則運算', '建置中', false, null),
      chapter('7up-1-4', '1-4 指數記法與科學記號', '建置中', false, null),
      chapter('7up-2-1', '2-1 因數與倍數', '建置中', false, null),
      chapter('7up-2-2', '2-2 最大公因數與最小公倍數', '建置中', false, null),
      chapter('7up-2-3', '2-3 分數的四則運算', '建置中', false, null),
      chapter('7up-2-4', '2-4 指數律', '建置中', false, null),
      chapter('7up-3-1', '3-1 代數式的化簡', '建置中', false, null),
      chapter('7up-3-2', '3-2 一元一次方程式', '建置中', false, null),
      chapter('7up-3-3', '3-3 應用問題', '建置中', false, null)
    ],
    '7down': makePlaceholderSemester('7down', {
      '7down-1-1': chapter('7down-1-1', '1-1 二元一次方程式', '6 題型混區史萊姆原野', true, 'chapter7d11', {
        fieldTitle:'七下 1-1｜二元一次方程式',
        fieldHint:'同區可選多種題型怪物；答對直接領獎回原野。',
        theme:{sky:'#d4efff', grass:'#73c18a', path:'#d7b07a'}
      })
    }),
    '8up': makePlaceholderSemester('8up'),
    '8down': makePlaceholderSemester('8down', {
      '8down-1-1': chapter('8down-1-1', '1-1 等差數列', '6 題型混區史萊姆原野', true, 'chapter8d11', {
        fieldTitle:'八下 1-1｜等差數列',
        fieldHint:'同一場景混合不同題型怪物，便於直接選題。',
        theme:{sky:'#d7f3ff', grass:'#89cf83', path:'#e0bf91'}
      })
    }),
    '9up': makePlaceholderSemester('9up'),
    '9down': makePlaceholderSemester('9down')
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

    getFloorGroups(semesterId){
      const map = new Map();
      (chapters[semesterId] || []).forEach((item) => {
        const floor = Number(item.floor || 1);
        if (!map.has(floor)) map.set(floor, []);
        map.get(floor).push(item);
      });
      return Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([floor, items]) => ({
          floor,
          label: `${floor}F`,
          items: items.sort((a, b) => Number(a.slot || 0) - Number(b.slot || 0))
        }));
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
