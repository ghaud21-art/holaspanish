// 커리큘럼 데이터
// 출처: (1) Prep 01~10 · 회화 II "Soy yo" 교재 목차 사진, (2) 회화 I "Soy Semi" 교재 목차 사진,
//       (3) 문법 교재 Unidad 01~60 전체 목차
// 화면에는 교재 출처를 노출하지 않고 하나의 통합 커리큘럼처럼 보여줍니다.

const PREP_CHAPTERS = [
  {
    id: 'prep-01', titleEs: 'Las cinco vocales', titleKr: '스페인어의 다섯 가지 모음',
    keyVocab: [
      { es: 'A', kr: '아 (casa 까사)' }, { es: 'E', kr: '에 (mesa 메사)' },
      { es: 'I', kr: '이 (libro 리브로)' }, { es: 'O', kr: '오 (perro 뻬로)' },
      { es: 'U', kr: '우 (uno 우노)' },
    ],
    examples: [{ es: 'casa', kr: '집' }, { es: 'mesa', kr: '탁자' }, { es: 'libro', kr: '책' }],
    writingPrompt: '오늘 배운 다섯 모음이 들어간 스페인어 단어를 3개 찾아 적어보세요.',
  },
  {
    id: 'prep-02', titleEs: 'Consonantes: B, C, D, F', titleKr: '스페인어의 자음 (B,C,D,F)',
    keyVocab: [
      { es: 'bueno', kr: '좋은 (B)' }, { es: 'casa', kr: '집 (C)' },
      { es: 'día', kr: '날 (D)' }, { es: 'fácil', kr: '쉬운 (F)' },
    ],
    writingPrompt: 'B, C, D, F로 시작하는 단어를 하나씩 찾아 적어보세요.',
  },
  {
    id: 'prep-03', titleEs: 'Consonantes: G, H, J, K', titleKr: '스페인어의 자음 (G,H,J,K)',
    keyVocab: [
      { es: 'gracias', kr: '고맙습니다 (G)' }, { es: 'hola', kr: '안녕 (H, 묵음)' },
      { es: 'jamón', kr: '하몬(햄) (J, 흐 소리)' }, { es: 'kilo', kr: '킬로 (K)' },
    ],
    writingPrompt: '"hola"의 H는 소리가 나지 않아요. 묵음 H가 들어간 단어를 하나 더 찾아보세요.',
  },
  {
    id: 'prep-04', titleEs: 'Consonantes: L, Ll, M, N, Ñ', titleKr: '스페인어의 자음 (L,Ll,M,N,Ñ)',
    keyVocab: [
      { es: 'luna', kr: '달 (L)' }, { es: 'llave', kr: '열쇠 (Ll)' },
      { es: 'mano', kr: '손 (M)' }, { es: 'noche', kr: '밤 (N)' }, { es: 'niño', kr: '아이 (Ñ)' },
    ],
    writingPrompt: 'Ñ가 들어간 단어를 최소 한 개 찾아 뜻과 함께 적어보세요.',
  },
  {
    id: 'prep-05', titleEs: 'Consonantes: P, Q, R, S, T', titleKr: '스페인어의 자음 (P,Q,R,S,T)',
    keyVocab: [
      { es: 'perro', kr: '개 (P, 굴리는 R)' }, { es: 'qué', kr: '무엇 (Q)' },
      { es: 'rojo', kr: '빨간색 (R)' }, { es: 'sol', kr: '태양 (S)' }, { es: 'tú', kr: '너 (T)' },
    ],
    writingPrompt: 'R이 두 번 겹치는 단어(perro처럼)를 하나 더 찾아보세요.',
  },
  {
    id: 'prep-06', titleEs: 'Consonantes: V, W, X, Y, Z', titleKr: '스페인어의 자음 (V,W,X,Y,Z)',
    keyVocab: [
      { es: 'vino', kr: '와인 (V, B와 비슷한 소리)' }, { es: 'web', kr: '웹 (W, 외래어에만)' },
      { es: 'examen', kr: '시험 (X)' }, { es: 'yo', kr: '나 (Y)' }, { es: 'zapato', kr: '신발 (Z)' },
    ],
    writingPrompt: 'V와 B의 발음이 비슷하다는 걸 기억하며, V로 시작하는 단어를 하나 더 찾아보세요.',
  },
  {
    id: 'prep-07', titleEs: 'Las reglas de acento', titleKr: '스페인어의 강세규칙',
    keyVocab: [
      { es: 'casa', kr: '모음/n/s로 끝나면 → 뒤에서 두 번째 음절 강세' },
      { es: 'reloj', kr: '그 외 자음으로 끝나면 → 마지막 음절 강세' },
      { es: 'café', kr: '규칙에서 벗어나면 → 강세 부호(´)로 표시' },
    ],
    examples: [{ es: 'ca-SA', kr: '집 (뒤에서 두 번째 강세)' }, { es: 'ca-FÉ', kr: '커피 (부호로 예외 표시)' }],
    writingPrompt: '강세 규칙을 참고해서 café, reloj, casa 세 단어의 강세 위치를 표시해보세요.',
  },
  {
    id: 'prep-08', titleEs: 'Saludos al encontrarse', titleKr: '만났을 때 하는 인사말',
    keyVocab: [
      { es: 'Hola', kr: '안녕' }, { es: 'Buenos días', kr: '좋은 아침' },
      { es: 'Buenas tardes', kr: '좋은 오후' }, { es: 'Buenas noches', kr: '좋은 밤' },
      { es: '¿Cómo estás?', kr: '어떻게 지내?' }, { es: 'Mucho gusto', kr: '만나서 반가워' },
    ],
    examples: [{ es: 'Hola, ¿cómo estás?', kr: '안녕, 어떻게 지내?' }, { es: 'Muy bien, gracias.', kr: '아주 좋아, 고마워.' }],
    writingPrompt: '오늘 시간대에 맞는 인사말로 대화를 시작하는 문장을 써보세요.',
  },
  {
    id: 'prep-09', titleEs: 'Saludos al despedirse', titleKr: '헤어질 때 하는 인사말',
    keyVocab: [
      { es: 'Adiós', kr: '잘 가 (작별)' }, { es: 'Hasta luego', kr: '이따 봐' },
      { es: 'Hasta mañana', kr: '내일 봐' }, { es: 'Nos vemos', kr: '또 보자' }, { es: 'Cuídate', kr: '몸조심해' },
    ],
    examples: [{ es: 'Bueno, hasta luego.', kr: '그럼, 이따 봐.' }, { es: '¡Cuídate mucho!', kr: '몸 잘 챙겨!' }],
    writingPrompt: '친구와 헤어질 때 쓸 수 있는 인사말 문장을 두 개 써보세요.',
  },
  {
    id: 'prep-10', titleEs: 'Gracias, felicitaciones y disculpas', titleKr: '감사/축하/사과의 마음 전하는 표현',
    keyVocab: [
      { es: 'Gracias', kr: '고마워' }, { es: 'De nada', kr: '천만에' },
      { es: 'Felicidades', kr: '축하해' }, { es: 'Lo siento', kr: '미안해' }, { es: 'Perdón', kr: '죄송합니다' },
    ],
    examples: [{ es: 'Muchas gracias por todo.', kr: '모든 것에 정말 고마워.' }, { es: 'Lo siento mucho.', kr: '정말 미안해.' }],
    writingPrompt: '감사, 축하, 사과 표현을 각각 하나씩 사용한 짧은 대화를 만들어보세요.',
  },
];

// 회화 I — "Soy Semi." 로 시작하는 교재 (Capítulo 01~30)
const BOOK1_CHAPTERS = [
  { id: 'conv1-01', titleEs: 'Soy Semi.', titleKr: '나는 세미야.',
    keyVocab: [{ es: 'ser', kr: '~이다' }, { es: 'nombre', kr: '이름' }, { es: 'llamarse', kr: '~라고 불리다' }],
    examples: [{ es: 'Soy Semi.', kr: '나는 세미야.' }, { es: '¿Cómo te llamas?', kr: '이름이 뭐야?' }, { es: 'Mucho gusto.', kr: '만나서 반가워.' }],
    writingPrompt: '너의 이름을 소개하는 문장을 스페인어로 써보세요.' },
  { id: 'conv1-02', titleEs: '¡Son carteristas!', titleKr: '소매치기예요!',
    keyVocab: [{ es: 'carterista', kr: '소매치기' }, { es: 'cuidado', kr: '조심' }, { es: 'bolso', kr: '가방' }],
    examples: [{ es: '¡Son carteristas!', kr: '소매치기예요!' }, { es: 'Ten cuidado con tu bolso.', kr: '가방 조심해.' }],
    writingPrompt: '위험한 상황을 보고 주변 사람에게 알리는 문장을 써보세요.' },
  { id: 'conv1-03', titleEs: 'Somos amigos.', titleKr: '우리는 친구예요.',
    keyVocab: [{ es: 'amigo/a', kr: '친구' }, { es: 'nosotros', kr: '우리' }],
    examples: [{ es: 'Somos amigos.', kr: '우리는 친구예요.' }, { es: 'Él es mi mejor amigo.', kr: '그는 내 가장 친한 친구야.' }],
    writingPrompt: '너의 친구를 스페인어로 한 문장 소개해보세요.' },
  { id: 'conv1-04', titleEs: 'No soy chino.', titleKr: '저 중국인 아니에요.',
    keyVocab: [{ es: 'chino/a', kr: '중국인' }, { es: 'coreano/a', kr: '한국인' }, { es: 'país', kr: '나라' }],
    examples: [{ es: 'No soy chino.', kr: '저 중국인 아니에요.' }, { es: 'Soy coreano.', kr: '저는 한국인이에요.' }, { es: '¿De dónde eres?', kr: '어디서 왔어?' }],
    writingPrompt: '너의 국적을 스페인어로 말해보세요.' },
  { id: 'conv1-05', titleEs: '¡Eres muy amable!', titleKr: '너 진짜 친절하다!',
    keyVocab: [{ es: 'amable', kr: '친절한' }, { es: 'muy', kr: '매우' }, { es: 'simpático/a', kr: '상냥한' }],
    examples: [{ es: '¡Eres muy amable!', kr: '너 진짜 친절하다!' }, { es: 'Muchas gracias por tu ayuda.', kr: '도와줘서 정말 고마워.' }],
    writingPrompt: '누군가에게 고마운 이유를 설명하는 문장을 써보세요.' },
  { id: 'conv1-06', titleEs: '¡Estoy emocionado!', titleKr: '저는 신났어요!',
    keyVocab: [{ es: 'estar', kr: '(상태가) ~이다' }, { es: 'emocionado/a', kr: '신난' }, { es: 'feliz', kr: '행복한' }],
    examples: [{ es: '¡Estoy emocionado!', kr: '저는 신났어요!' }, { es: 'Estoy muy feliz hoy.', kr: '오늘 정말 행복해.' }],
    writingPrompt: '지금 너의 기분을 스페인어 문장으로 표현해보세요.' },
  { id: 'conv1-07', titleEs: '¡Estás guapo hoy!', titleKr: '너 오늘 멋지다!',
    keyVocab: [{ es: 'guapo/a', kr: '잘생긴/예쁜' }, { es: 'hoy', kr: '오늘' }, { es: 'ropa', kr: '옷' }],
    examples: [{ es: '¡Estás guapo hoy!', kr: '너 오늘 멋지다!' }, { es: 'Me gusta tu ropa.', kr: '네 옷 마음에 들어.' }],
    writingPrompt: '친구의 오늘 모습을 칭찬하는 문장을 써보세요.' },
  { id: 'conv1-08', titleEs: '¿Está abierto?', titleKr: '영업 중이에요?',
    keyVocab: [{ es: 'abierto/a', kr: '열린' }, { es: 'cerrado/a', kr: '닫힌' }, { es: 'tienda', kr: '가게' }],
    examples: [{ es: '¿Está abierto?', kr: '영업 중이에요?' }, { es: 'Está cerrado los lunes.', kr: '월요일에는 닫아요.' }],
    writingPrompt: '가게가 열려 있는지 묻는 문장을 써보세요.' },
  { id: 'conv1-09', titleEs: '¿Dónde está el baño?', titleKr: '화장실이 어디예요?',
    keyVocab: [{ es: 'baño', kr: '화장실' }, { es: 'dónde', kr: '어디' }, { es: 'a la derecha', kr: '오른쪽에' }],
    examples: [{ es: '¿Dónde está el baño?', kr: '화장실이 어디예요?' }, { es: 'Está a la derecha.', kr: '오른쪽에 있어요.' }],
    writingPrompt: '길을 묻는 문장을 스페인어로 써보세요.' },
  { id: 'conv1-10', titleEs: 'Está bueno.', titleKr: '맛있어요.',
    keyVocab: [{ es: 'bueno/a', kr: '맛있는/좋은' }, { es: 'rico/a', kr: '맛있는' }, { es: 'comida', kr: '음식' }],
    examples: [{ es: 'Está bueno.', kr: '맛있어요.' }, { es: '¡Qué rico!', kr: '진짜 맛있다!' }],
    writingPrompt: '방금 먹은 음식에 대한 감상을 써보세요.' },
  { id: 'conv1-11', titleEs: 'Es gratis, ¿no?', titleKr: '무료이죠?' },
  { id: 'conv1-12', titleEs: 'Hablo un poco de español.', titleKr: '저는 스페인어 조금 해요.' },
  { id: 'conv1-13', titleEs: 'Trabajo en un restaurante.', titleKr: '저는 어떤 식당에서 일해요.' },
  { id: 'conv1-14', titleEs: 'No como cilantro.', titleKr: '저는 고수 안 먹어요.' },
  { id: 'conv1-15', titleEs: 'Creo que sí.', titleKr: '그런 것 같아.' },
  { id: 'conv1-16', titleEs: '¿Compartimos?', titleKr: '쉐어할까?' },
  { id: 'conv1-17', titleEs: 'Pues, sí.', titleKr: '맞아.' },
  { id: 'conv1-18', titleEs: 'Aprender español es divertido.', titleKr: '스페인어를 배우는 것은 재미있어요.' },
  { id: 'conv1-19', titleEs: 'No sé.', titleKr: '글쎄.' },
  { id: 'conv1-20', titleEs: '¿Me conoces?', titleKr: '너 나 알아?' },
  { id: 'conv1-21', titleEs: 'Te veo mañana.', titleKr: '내일 봐.' },
  { id: 'conv1-22', titleEs: 'Hace buen tiempo.', titleKr: '날씨 좋다.' },
  { id: 'conv1-23', titleEs: '¿Cuánto vale?', titleKr: '얼마예요?' },
  { id: 'conv1-24', titleEs: '¡Vamos!', titleKr: '가자!' },
  { id: 'conv1-25', titleEs: 'Voy a salir.', titleKr: '전 나갈 거예요.' },
  { id: 'conv1-26', titleEs: 'La cuenta, por favor.', titleKr: '계산서 주세요.' },
  { id: 'conv1-27', titleEs: 'Soy una persona vaga.', titleKr: '저는 게으른 사람이에요.' },
  { id: 'conv1-28', titleEs: '¿Qué haces?', titleKr: '뭐 해?' },
  { id: 'conv1-29', titleEs: '¿Para comer aquí o para llevar?', titleKr: '드시고 가세요, 포장하세요?' },
  { id: 'conv1-30', titleEs: '¿A dónde vas?', titleKr: '너 어디가?' },
];

// 회화 II — "Soy yo." 로 시작하는 교재 (Capítulo 01~30)
const BOOK2_CHAPTERS = [
  { id: 'conv2-01', titleEs: 'Soy yo.', titleKr: '저예요.',
    keyVocab: [{ es: 'ser', kr: '~이다' }, { es: 'yo', kr: '나' }, { es: 'presentarse', kr: '자기소개하다' }],
    examples: [{ es: 'Soy yo.', kr: '저예요.' }, { es: '¿Quién es?', kr: '누구세요?' }],
    writingPrompt: '전화 통화에서 자신을 소개하는 문장을 써보세요.' },
  { id: 'conv2-02', titleEs: '¿Estamos?', titleKr: '우리 문제 없지?',
    keyVocab: [{ es: 'estar', kr: '(상태가) ~이다' }, { es: 'problema', kr: '문제' }, { es: 'bien', kr: '좋은/잘' }],
    examples: [{ es: '¿Estamos?', kr: '우리 문제 없지?' }, { es: 'Todo está bien.', kr: '다 괜찮아.' }],
    writingPrompt: '친구와 오해를 푸는 문장을 써보세요.' },
  { id: 'conv2-03', titleEs: 'No hay problema.', titleKr: '문제 없어요.',
    keyVocab: [{ es: 'hay', kr: '있다' }, { es: 'problema', kr: '문제' }],
    examples: [{ es: 'No hay problema.', kr: '문제 없어요.' }, { es: '¿Hay algún problema?', kr: '무슨 문제 있어요?' }],
    writingPrompt: '걱정하는 사람을 안심시키는 문장을 써보세요.' },
  { id: 'conv2-04', titleEs: 'Hay que trabajar.', titleKr: '일 해야지.',
    keyVocab: [{ es: 'hay que', kr: '~해야 한다' }, { es: 'trabajar', kr: '일하다' }],
    examples: [{ es: 'Hay que trabajar.', kr: '일 해야지.' }, { es: 'Hay que estudiar más.', kr: '더 공부해야 해.' }],
    writingPrompt: '오늘 해야 할 일을 스페인어 문장으로 써보세요.' },
  { id: 'conv2-05', titleEs: '¿Qué hora es?', titleKr: '몇 시야?',
    keyVocab: [{ es: 'hora', kr: '시각' }, { es: 'reloj', kr: '시계' }, { es: 'tarde', kr: '오후' }],
    examples: [{ es: '¿Qué hora es?', kr: '몇 시야?' }, { es: 'Son las tres de la tarde.', kr: '오후 3시야.' }],
    writingPrompt: '오늘 너의 하루 일정을 시간과 함께 써보세요.' },
  { id: 'conv2-06', titleEs: 'Son doscientos euros.', titleKr: '200유로예요.',
    keyVocab: [{ es: 'euro', kr: '유로' }, { es: 'cuánto', kr: '얼마' }, { es: 'precio', kr: '가격' }],
    examples: [{ es: 'Son doscientos euros.', kr: '200유로예요.' }, { es: '¿Cuánto cuesta?', kr: '얼마예요?' }],
    writingPrompt: '물건 가격을 묻고 답하는 문장을 써보세요.' },
  { id: 'conv2-07', titleEs: 'Ese tío es mío.', titleKr: '저 남자애 내 거야.',
    keyVocab: [{ es: 'tío', kr: '남자애 (구어)' }, { es: 'mío/a', kr: '나의 것' }, { es: 'ese/a', kr: '그' }],
    examples: [{ es: 'Ese tío es mío.', kr: '저 남자애 내 거야.' }, { es: 'Es mi novio.', kr: '내 남자친구야.' }],
    writingPrompt: '소유를 표현하는 문장을 써보세요 (이건 내 거야 등).' },
  { id: 'conv2-08', titleEs: '¿Qué es esto?', titleKr: '이게 뭐야?',
    keyVocab: [{ es: 'esto', kr: '이것' }, { es: 'qué', kr: '무엇' }, { es: 'cosa', kr: '물건' }],
    examples: [{ es: '¿Qué es esto?', kr: '이게 뭐야?' }, { es: 'No sé qué es esto.', kr: '이게 뭔지 모르겠어.' }],
    writingPrompt: '모르는 물건에 대해 질문하는 문장을 써보세요.' },
  { id: 'conv2-09', titleEs: 'Te quiero.', titleKr: '널 사랑해.',
    keyVocab: [{ es: 'querer', kr: '사랑하다/원하다' }, { es: 'amor', kr: '사랑' }, { es: 'también', kr: '또한' }],
    examples: [{ es: 'Te quiero.', kr: '널 사랑해.' }, { es: 'Yo también te quiero.', kr: '나도 널 사랑해.' }],
    writingPrompt: '소중한 사람에게 마음을 전하는 문장을 써보세요.' },
  { id: 'conv2-10', titleEs: 'Quiero descansar.', titleKr: '저는 쉬고 싶어요.',
    keyVocab: [{ es: 'querer', kr: '원하다' }, { es: 'descansar', kr: '쉬다' }, { es: 'cansado/a', kr: '피곤한' }],
    examples: [{ es: 'Quiero descansar.', kr: '저는 쉬고 싶어요.' }, { es: 'Estoy muy cansado.', kr: '나 너무 피곤해.' }],
    writingPrompt: '지금 하고 싶은 것을 스페인어로 써보세요.' },
  { id: 'conv2-11', titleEs: 'No tengo novia.', titleKr: '저는 여자친구가 없어요.' },
  { id: 'conv2-12', titleEs: 'Tengo hambre.', titleKr: '저는 배고파요.',
    keyVocab: [{ es: 'tener', kr: '가지다/~이 있다' }, { es: 'hambre', kr: '배고픔' }, { es: 'sed', kr: '목마름' }],
    examples: [{ es: 'Tengo hambre.', kr: '저는 배고파요.' }, { es: '¿Tienes sed?', kr: '너 목말라?' }],
    writingPrompt: '지금 배고픈지 목마른지 스페인어 문장으로 써보세요.' },
  { id: 'conv2-13', titleEs: 'Tienes que esperar un poco.', titleKr: '너는 조금 기다려야 해.' },
  { id: 'conv2-14', titleEs: 'Pero, ¿qué dices?', titleKr: '너 무슨 소리야?' },
  { id: 'conv2-15', titleEs: '¿Recuerdas?', titleKr: '기억나?' },
  { id: 'conv2-16', titleEs: '¿Puedo pasar?', titleKr: '저 지나가도 될까요?' },
  { id: 'conv2-17', titleEs: 'Más vale tarde que nunca.', titleKr: '늦은 때는 없다.' },
  { id: 'conv2-18', titleEs: 'Estoy mejor.', titleKr: '전 나아졌어요.' },
  { id: 'conv2-19', titleEs: 'La playa más bonita del mundo.', titleKr: '세상에서 가장 예쁜 해변.' },
  { id: 'conv2-20', titleEs: '¡Eres el mejor!', titleKr: '너가 최고야!' },
  { id: 'conv2-21', titleEs: 'Estoy buscando un cajero.', titleKr: '저는 ATM을 찾는 중이에요.' },
  { id: 'conv2-22', titleEs: 'Llevo dos meses aprendiendo español.', titleKr: '저는 스페인어 배운 지 두 달 됐어요.' },
  { id: 'conv2-23', titleEs: 'Te echo de menos.', titleKr: '너가 보고 싶어.' },
  { id: 'conv2-24', titleEs: '¿Nos puedes ayudar?', titleKr: '너 우리를 도와줄 수 있어?' },
  { id: 'conv2-25', titleEs: 'Te escribo.', titleKr: '너에게 문자 보낼게.' },
  { id: 'conv2-26', titleEs: '¿Me lo puedes pasar?', titleKr: '나에게 그것 좀 건네줄래?' },
  { id: 'conv2-27', titleEs: 'Me gusta la carne.', titleKr: '저는 고기를 좋아해요.' },
  { id: 'conv2-28', titleEs: '¡Me encanta!', titleKr: '완전 좋아!' },
  { id: 'conv2-29', titleEs: 'No he desayunado.', titleKr: '나 아침 못 먹었어.' },
  { id: 'conv2-30', titleEs: 'Nunca he probado conejo.', titleKr: '저 토끼 안 먹어 봤어요.' },
];

// 문법 I (Unidad 1~40) — 사용자가 보내준 문법 교재 전체 목차 기준
const GRAMMAR_B1_CHAPTERS = [
  { num: 1, titleEs: 'El género del sustantivo', titleKr: '명사의 성' },
  { num: 2, titleEs: 'El número del sustantivo', titleKr: '명사의 수' },
  { num: 3, titleEs: 'Los artículos indefinido y definido', titleKr: '부정 관사와 정관사' },
  { num: 4, titleEs: 'Los adjetivos', titleKr: '형용사' },
  { num: 5, titleEs: 'Los pronombres personales y el verbo ser', titleKr: '주격 인칭 대명사와 동사 ser' },
  { num: 6, titleEs: 'El verbo estar', titleKr: '동사 estar' },
  { num: 7, titleEs: 'El verbo hay', titleKr: '동사 hay' },
  { num: 8, titleEs: 'Los verbos -ar y el presente', titleKr: '-ar 동사와 현재 시제' },
  { num: 9, titleEs: 'Los verbos -er y los interrogativos I', titleKr: '-er 동사와 의문사 1' },
  { num: 10, titleEs: 'Los verbos -ir y los interrogativos II', titleKr: '-ir 동사와 의문사 2' },
  { num: 11, titleEs: 'El gerundio y el presente progresivo', titleKr: '현재 분사와 진행형' },
  { num: 12, titleEs: 'El verbo ir y verbos irregulares I (e→ie)', titleKr: '동사 ir와 불규칙 동사 1 (e-ie)' },
  { num: 13, titleEs: 'Verbos irregulares II (o→ue)', titleKr: '불규칙 동사 2 (o-ue)' },
  { num: 14, titleEs: 'Verbos irregulares III (tener, dar)', titleKr: '불규칙 동사 3 (tener, dar)' },
  { num: 15, titleEs: 'Verbos irregulares IV', titleKr: '불규칙 동사 4' },
  { num: 16, titleEs: 'Los adjetivos posesivos', titleKr: '소유 형용사' },
  { num: 17, titleEs: 'Preposiciones I / preposición + pronombre', titleKr: '전치사 1 / 전치사 + 대명사' },
  { num: 18, titleEs: 'Preposiciones II (para vs. por)', titleKr: '전치사 2 (para vs por)' },
  { num: 19, titleEs: 'Saber vs. conocer', titleKr: 'saber vs conocer' },
  { num: 20, titleEs: 'El comparativo de igualdad', titleKr: '원급 비교 (동등 비교)' },
  { num: 21, titleEs: 'El comparativo', titleKr: '비교급' },
  { num: 22, titleEs: 'El superlativo', titleKr: '최상급' },
  { num: 23, titleEs: 'El objeto directo', titleKr: '직접 목적어' },
  { num: 24, titleEs: 'El objeto indirecto', titleKr: '간접 목적어' },
  { num: 25, titleEs: 'Los verbos reflexivos', titleKr: '재귀 동사' },
  { num: 26, titleEs: 'Verbos de estructura inversa', titleKr: '역구조 동사 (gustar형)' },
  { num: 27, titleEs: 'El imperativo I', titleKr: '명령형 1' },
  { num: 28, titleEs: 'El imperativo II', titleKr: '명령형 2' },
  { num: 29, titleEs: 'El pretérito perfecto', titleKr: '현재 완료' },
  { num: 30, titleEs: 'El pretérito indefinido I (-ar)', titleKr: '단순 과거 1 (-ar)' },
  { num: 31, titleEs: 'El pretérito indefinido II (-er, -ir)', titleKr: '단순 과거 2 (-er, -ir)' },
  { num: 32, titleEs: 'El pretérito indefinido III (irregulares)', titleKr: '단순 과거 3 (불규칙)' },
  { num: 33, titleEs: 'El pretérito imperfecto', titleKr: '불완료 과거' },
  { num: 34, titleEs: 'El futuro simple', titleKr: '단순 미래' },
  { num: 35, titleEs: 'El condicional simple', titleKr: '가능법' },
  { num: 36, titleEs: 'El pluscuamperfecto y el futuro perfecto', titleKr: '과거 완료, 미래 완료' },
  { num: 37, titleEs: 'El se I (recíproco / sujeto impersonal)', titleKr: 'se 1 (상호 / 무인칭 주어의 se)' },
  { num: 38, titleEs: 'El se II (pasivo)', titleKr: 'se 2 (수동의 se)' },
  { num: 39, titleEs: 'El se III (involuntario)', titleKr: 'se 3 (무의지의 se)' },
  { num: 40, titleEs: 'Las conjunciones', titleKr: '접속사' },
];

// 문법 II (Unidad 41~60)
const GRAMMAR_B2_CHAPTERS = [
  { num: 41, titleEs: 'Los conectores', titleKr: '연결사' },
  { num: 42, titleEs: 'El subjuntivo I', titleKr: '접속법 1' },
  { num: 43, titleEs: 'El subjuntivo II', titleKr: '접속법 2' },
  { num: 44, titleEs: 'El subjuntivo III', titleKr: '접속법 3' },
  { num: 45, titleEs: 'El subjuntivo IV', titleKr: '접속법 4' },
  { num: 46, titleEs: 'El subjuntivo V', titleKr: '접속법 5' },
  { num: 47, titleEs: 'El subjuntivo VI', titleKr: '접속법 6' },
  { num: 48, titleEs: 'El subjuntivo imperfecto', titleKr: '접속법 과거' },
  { num: 49, titleEs: 'El condicional: presente y pasado', titleKr: '가정법 현재, 가정법 과거' },
  { num: 50, titleEs: 'El condicional compuesto y mixto', titleKr: '가정법 과거 완료, 혼합 가정법' },
  { num: 51, titleEs: 'Las oraciones exclamativas', titleKr: '감탄문' },
  { num: 52, titleEs: 'El artículo neutro lo', titleKr: '중성 관사 lo' },
  { num: 53, titleEs: 'Los pronombres relativos I', titleKr: '관계 대명사 1' },
  { num: 54, titleEs: 'Los pronombres relativos II', titleKr: '관계 대명사 2' },
  { num: 55, titleEs: 'Los relativos', titleKr: '관계사' },
  { num: 56, titleEs: 'Verbos de cambio I', titleKr: '변화의 동사 1' },
  { num: 57, titleEs: 'Verbos de cambio II', titleKr: '변화의 동사 2' },
  { num: 58, titleEs: 'El estilo indirecto', titleKr: '화법' },
  { num: 59, titleEs: 'Los sufijos apreciativos', titleKr: '평가 접미사' },
  { num: 60, titleEs: 'Me gustaría...', titleKr: 'Me gustaría (바람 표현)' },
];

function buildGrammarChapters(list, prefix) {
  return list.map((u) => ({
    id: `${prefix}-${String(u.num).padStart(2, '0')}`,
    titleEs: u.titleEs,
    titleKr: u.titleKr,
    grammarPoint: u.titleKr,
    writingPrompt: `이번 유닛의 문법 포인트(${u.titleKr})를 활용해서 스페인어 문장을 2개 만들어보세요.`,
  }));
}

export const CURRICULUM = [
  { key: 'prep', label: 'Prep · 발음과 인사', levelTag: 'Prep', chapters: PREP_CHAPTERS },
  { key: 'book1', label: 'A1 · 회화 I', levelTag: 'A1', chapters: BOOK1_CHAPTERS },
  { key: 'book2', label: 'A2 · 회화 II', levelTag: 'A2', chapters: BOOK2_CHAPTERS },
  { key: 'gramB1', label: 'B1 · 문법 I', levelTag: 'B1', chapters: buildGrammarChapters(GRAMMAR_B1_CHAPTERS, 'gram') },
  { key: 'gramB2', label: 'B2 · 문법 II', levelTag: 'B2', chapters: buildGrammarChapters(GRAMMAR_B2_CHAPTERS, 'gram') },
];

export const FLAT_CHAPTERS = CURRICULUM.flatMap((lvl) =>
  lvl.chapters.map((c) => ({ ...c, levelKey: lvl.key, levelLabel: lvl.label, levelTag: lvl.levelTag }))
);

export function findChapter(id) {
  return FLAT_CHAPTERS.find((c) => c.id === id);
}

// 레벨테스트 문항 — 레벨(prep→A1→A2→B1→B2) 순서대로 난이도가 올라가도록 각 레벨당 3문항씩 배치했습니다.
// 각 문항은 "지시문 + 빈칸 문장 + 보기 4개" 형식이고, 마지막 보기는 항상 "잘 모르겠습니다"(추측 방지, 오답 처리)입니다.
export const SKIP_LABEL = '잘 모르겠습니다. (정확성을 위해, 추측은 삼가 부탁드립니다)';

export const TEST_QUESTIONS = [
  // Prep
  { levelKey: 'prep', instruction: '알맞은 관사를 고르세요', prompt: '____ casa es bonita.', options: ['El', 'La', 'Los', 'Unos'], correct: 1 },
  { levelKey: 'prep', instruction: '올바른 동사를 고르세요', prompt: 'Yo ____ en Madrid.', options: ['vives', 'vivo', 'vive', 'vivís'], correct: 1 },
  { levelKey: 'prep', instruction: '알맞은 형용사 형태를 고르세요', prompt: 'El coche es muy ____.', options: ['grandes', 'grande', 'gran', 'grandos'], correct: 1 },
  // A1 (book1)
  { levelKey: 'book1', instruction: '알맞은 전치사를 고르세요', prompt: 'El libro está ____ la mesa.', options: ['sobre', 'a', 'de', 'por'], correct: 0 },
  { levelKey: 'book1', instruction: '올바른 동사 형태를 고르세요', prompt: 'Ayer ____ al cine.', options: ['fui', 'voy', 'iré', 'iba'], correct: 0 },
  { levelKey: 'book1', instruction: '올바른 재귀동사를 고르세요', prompt: 'Cada mañana yo ____ a las 7.', options: ['me levanto', 'levanto', 'me levantaré', 'levanté'], correct: 0 },
  // A2 (book2)
  { levelKey: 'book2', instruction: '알맞은 조건 시제를 고르세요', prompt: 'Si tuviera tiempo, ____ a la playa.', options: ['iría', 'voy', 'fui', 'iré'], correct: 0 },
  { levelKey: 'book2', instruction: '알맞은 대명사를 고르세요', prompt: 'Juan tiene un coche nuevo, pero no ____ gusta.', options: ['lo', 'la', 'le', 'los'], correct: 2 },
  { levelKey: 'book2', instruction: '알맞은 미래 시제 형태를 고르세요', prompt: 'Mañana ____ a casa de mis padres.', options: ['iré', 'fui', 'vengo', 'iría'], correct: 0 },
  // B1 (gramB1)
  { levelKey: 'gramB1', instruction: '올바른 가정법 형태를 고르세요', prompt: 'Es importante que ____ temprano.', options: ['llegas', 'llegues', 'llegabas', 'llegarás'], correct: 1 },
  { levelKey: 'gramB1', instruction: '알맞은 연결사를 고르세요', prompt: 'No me gusta estudiar, ____ sé que es importante.', options: ['pero', 'por lo tanto', 'si', 'entonces'], correct: 0 },
  { levelKey: 'gramB1', instruction: '알맞은 비교형을 고르세요', prompt: 'Esta película es ____ interesante que la otra.', options: ['más', 'mucho', 'tanto', 'menor'], correct: 0 },
  // B2 (gramB2)
  { levelKey: 'gramB2', instruction: '알맞은 비인칭 표현을 고르세요', prompt: '____ que tengas paciencia.', options: ['Se recomienda', 'Es necesario', 'Debe', 'Hay'], correct: 1 },
  { levelKey: 'gramB2', instruction: '올바른 복합문 구조를 고르세요', prompt: 'Es lógico que él ____ tenido éxito, dado su esfuerzo.', options: ['haya', 'ha', 'habría', 'hubiera'], correct: 0 },
  { levelKey: 'gramB2', instruction: '가정된 상황에 맞는 올바른 구조를 고르세요', prompt: 'Si no ____ a la universidad, no habría conseguido ese trabajo.', options: ['hubiera ido', 'voy', 'fuera', 'haya ido'], correct: 0 },
];

const LEVEL_ORDER = CURRICULUM.map((lvl) => lvl.key);

// answers: TEST_QUESTIONS와 같은 길이의 배열. 고른 보기 인덱스, 건너뛰었다면 -1.
export function evaluateTest(answers) {
  const byLevel = {};
  TEST_QUESTIONS.forEach((q, i) => {
    byLevel[q.levelKey] = byLevel[q.levelKey] || { correct: 0, total: 0 };
    byLevel[q.levelKey].total += 1;
    if (answers[i] === q.correct) byLevel[q.levelKey].correct += 1;
  });

  let recommended = LEVEL_ORDER[0];
  for (const key of LEVEL_ORDER) {
    const stat = byLevel[key];
    if (!stat) break;
    const accuracy = stat.correct / stat.total;
    if (accuracy >= 0.6) {
      recommended = key;
    } else {
      break;
    }
  }
  return { recommendedKey: recommended, byLevel };
}
