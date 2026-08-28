/* GRID Chain launchpad frontend. Zero dependencies. */
'use strict';

// ---------------------------------------------------------------- i18n
const I18N = {
  en: {
    tabCoins: 'COINS', tabTrade: 'TRADE', tabCreate: 'CREATE', tabWallet: 'WALLET',
    block: 'Block', txs: 'Transactions', coinsN: 'Coins', accounts: 'Accounts', volume: 'Volume',
    latestCells: 'Latest cells', liveFeed: 'Live on-chain feed',
    noCoins: 'no coins yet — be the first cell on the grid', createFirst: 'create a coin',
    waitingTx: 'waiting for the first transaction…',
    price: 'Price', marketCap: 'Market cap', liquidity: 'Liquidity', holders: 'Holders',
    trades: 'Trades', yourBag: 'Your bag', progress: 'Progress', curve: 'curve',
    graduationAt: 'graduation at 10,000 GRID', topHolders: 'Top holders', noHolders: 'no holders yet',
    market: 'Market', buy: 'BUY', sell: 'SELL', amountGrid: 'amount, GRID', amountTokens: 'amount, tokens',
    notEnoughChart: 'not enough trades yet',
    launchCoin: 'Launch a coin', ticker: 'ticker (2–8, A–Z / 0–9)', name: 'name', desc: 'description',
    imageUrl: 'image url (optional)', createBtn: 'CREATE COIN — 100 GRID FEE',
    needWallet: 'you need a wallet first', createOne: 'create one',
    feeNote: 'fee is burned on-chain · supply 1,000,000,000 fixed · trading starts instantly on the bonding curve',
    yourBalance: 'your balance',
    walletTitle: 'Wallet', keysNote: 'keys live only in your browser (localStorage). the node never stores your secret.',
    createWallet: 'CREATE NEW WALLET', importSecret: 'IMPORT SECRET KEY',
    noWebcrypto: 'this browser has no WebCrypto — open in Telegram or a modern browser',
    address: 'ADDRESS', getTestGrid: 'GET TEST GRID', showSecret: 'SHOW SECRET',
    faucetNote: 'faucet: 5,000 GRID once per hour', neverShare: 'never share this — anyone with it owns the wallet',
    profile: 'Profile', profileName: 'display name (on-chain)', saveName: 'SET NAME',
    unnamed: 'unnamed', createdCoins: 'Created coins', activity: 'Activity', noActivity: 'no activity yet',
    sendTitle: 'Send', recipient: 'recipient — address or @name', asset: 'asset',
    sendBtn: 'SEND', recipientFound: '✓ recipient found', badRecipient: 'recipient not found',
    enterRecipient: 'enter a recipient', sent: '✓ sent',
    commentsTitle: 'Chat · on-chain', saySomething: 'say something…', post: 'POST',
    commentFee: '1 GRID per message, burned on-chain · sealed into a block',
    noComments: 'no messages yet — be the first to write on-chain',
    walletToChat: 'connect a wallet to chat',
    live: 'LIVE', favorites: 'Favorites', favAdd: '★ added to favorites', favRemove: '☆ removed from favorites',
    top: 'Top', topTraders: 'Traders', topCreators: 'Creators', topChatters: 'Chatters', topCoins: 'Coins',
    explorer: 'Explorer', searchPh: 'block № / address / tx hash / $TICKER', search: 'SEARCH',
    block: 'Block', notFound: 'nothing found', txsN: 'txs', time: 'time',
    limitOrder: 'Limit order', openOrders: 'Open orders', noOrders: 'no open orders', place: 'PLACE',
    side: 'side', cancel: 'CANCEL', atNow: '≈ now', escrowNote: 'funds are locked on-chain until filled or cancelled',
    share: 'Share', shareVia: 'Telegram', copyLink: 'copy link', ogCard: 'preview card',
    shareMsg: (tk) => `$${tk} is trading on GRID Chain 🕯️`,
    alert: 'Alert', alertSet: (pct) => `alert set: ±${pct}%`,
    alertUp: (tk, pct) => `🔥 $${tk} +${pct}%`, alertDown: (tk, pct) => `🧊 $${tk} -${pct}%`,
    avgEntry: 'avg entry', pnl: 'PnL', value: 'Value', positions: 'Positions',
    feeNoteTrade: '1% fee: half burned, half to the coin creator',
    ach_first_coin: 'first coin', ach_trader_10: 'degen', ach_trader_100: 'chad trader',
    ach_chatter: 'voice of the grid', ach_loud: 'loudmouth', ach_whale: 'whale',
    ach_graduator: 'graduator', ach_collector: 'collector',
    achievements: 'Achievements',
    nativeCoin: 'Native coin', buyGrid: 'BUY GRID', buyTitle: 'Buy GRID',
    supply: 'Supply', inCirculation: 'In circulation', rate: 'Rate',
    rateNotSet: 'rate not set yet — admin sets the GRID/USDT price',
    chooseCurrency: 'Currency', payAmount: 'Amount, USDT', youGet: 'You get',
    createRequest: 'CREATE BUY REQUEST', memoLabel: 'MEMO / comment — REQUIRED',
    sendExactly: `Send the amount to the address below with the memo, then wait for admin confirmation.`,
    myRequests: 'My requests', pending: 'pending', approved: 'approved', rejected: 'rejected',
    depositAddress: 'Deposit address', admin: 'Admin', adminPanel: 'Admin panel',
    claimAdmin: 'CLAIM ROOT ADMIN', claimAdminNote: 'first wallet to claim becomes root admin — on-chain, forever',
    grantTitle: 'Grant GRID', grantAmount: 'amount per account', grantBtn: 'MINT TO SELECTED',
    noAccounts: 'no accounts yet', selected: 'selected',
    settingsTitle: 'Settings', usdtRateLabel: 'GRID price in USDT', tonRateLabel: 'GRID price in TON', save: 'SAVE',    depositsTitle: 'Buy requests', approve: 'APPROVE', reject: 'REJECT',
    noDeposits: 'no requests yet', youAreAdmin: 'you are root admin', notAdmin: 'connect the admin wallet',
    login: 'Login', register: 'Create account', username: 'username', password: 'password',
    loginBtn: 'LOG IN', registerBtn: 'REGISTER', logout: 'LOG OUT',
    authNote: 'account = wallet + password backup. log in from any device',
    loggedInAs: 'account', authFailed: 'wrong username or password', userExists: 'username taken',
    registerOk: '✓ account created', regPrompt: 'or create an account with login & password',
    loginPrompt: 'already have an account? log in', accountWallet: 'account wallet', localWallet: 'local wallet',
    useAccount: 'USE ACCOUNT', useLocal: 'USE LOCAL WALLET', twoWallets: 'you have both a local wallet and a logged-in account — different addresses',
    obTagline: 'launch coins · trade on-chain', guest: 'continue without an account →',
    cardStyle: 'card',
    continueTg: 'CONTINUE WITH TELEGRAM', continueGoogle: 'CONTINUE WITH GOOGLE',
    tgOpenNote: 'open this app in Telegram to use one-tap login',
    cardsTitle: 'NFT CARDS', mintBtn: 'MINT A CARD', mintedN: 'minted',
    myCards: 'My cards', market: 'Marketplace', equip: 'EQUIP', equipped: 'EQUIPPED',
    sellCard: 'SELL', delist: 'DELIST', buyCard: 'BUY', noCards: 'no cards yet',
    noMarket: 'nothing listed for sale', cardsNote: '1000 unique generative patterns · 500 GRID per mint, burned · 2.5% marketplace fee',
    reveal: 'TAP TO CONTINUE', cardLuck: '🔥 incredible luck!', cardNice: 'nice pull',
    r_common: 'Common', r_rare: 'Rare', r_epic: 'Epic', r_legendary: 'Legendary',
    needFunds: 'not enough GRID — use the faucet or buy GRID', soldOut: 'all 1000 cards are minted',
    copy: 'copy', copied: 'copied',
    queued: 'queued — waiting for a block…', confirmed: '✓ confirmed', stillPending: 'still pending… refresh in a moment',
    enterAmount: 'enter an amount', badTicker: 'bad ticker', nameRequired: 'name required',
    notEnoughGrid: 'not enough GRID — use the faucet', createdLive: (t) => `✓ $${t} is live`,
    walletFirst: 'create a wallet first', imported: 'wallet imported', importFailed: 'import failed (bad secret or unsupported browser)',
    footer: 'GRID Chain testnet — PoA v0.1. Coins here are testnet points with no value. Every trade is a signed transaction sealed in a block. DYOR.',
  },
  ru: {
    tabCoins: 'МОНЕТЫ', tabTrade: 'ТОРГИ', tabCreate: 'СОЗДАТЬ', tabWallet: 'КОШЕЛЁК',
    block: 'Блок', txs: 'Транзакции', coinsN: 'Монеты', accounts: 'Аккаунты', volume: 'Объём',
    latestCells: 'Новые ячейки', liveFeed: 'Живая лента цепи',
    noCoins: 'монет пока нет — стань первой ячейкой сетки', createFirst: 'создать монету',
    waitingTx: 'ждём первую транзакцию…',
    price: 'Цена', marketCap: 'Капитализация', liquidity: 'Ликвидность', holders: 'Холдеры',
    trades: 'Сделки', yourBag: 'В портфеле', progress: 'Прогресс', curve: 'кривая',
    graduationAt: 'градация на 10,000 GRID', topHolders: 'Топ холдеров', noHolders: 'холдеров пока нет',
    market: 'Рынок', buy: 'КУПИТЬ', sell: 'ПРОДАТЬ', amountGrid: 'сумма, GRID', amountTokens: 'количество, монет',
    notEnoughChart: 'сделок пока мало',
    launchCoin: 'Запустить монету', ticker: 'тикер (2–8, A–Z / 0–9)', name: 'название', desc: 'описание',
    imageUrl: 'ссылка на картинку (не обязательно)', createBtn: 'СОЗДАТЬ МОНЕТУ — ФИ 100 GRID',
    needWallet: 'сначала нужен кошелёк', createOne: 'создать',
    feeNote: 'фи сжигается на цепи · саплай 1,000,000,000 · торговля стартует сразу на bonding curve',
    yourBalance: 'ваш баланс',
    walletTitle: 'Кошелёк', keysNote: 'ключи живут только в вашем браузере. нода никогда не видит ваш секрет.',
    createWallet: 'СОЗДАТЬ КОШЕЛЁК', importSecret: 'ИМПОРТ СЕКРЕТНОГО КЛЮЧА',
    noWebcrypto: 'в браузере нет WebCrypto — откройте в Telegram или современном браузере',
    address: 'АДРЕС', getTestGrid: 'ПОЛУЧИТЬ TEST GRID', showSecret: 'ПОКАЗАТЬ КЛЮЧ',
    faucetNote: 'фосет: 5,000 GRID раз в час', neverShare: 'никому не показывайте — у кого ключ, тот владелец',
    profile: 'Профиль', profileName: 'имя (записывается на цепь)', saveName: 'СОХРАНИТЬ ИМЯ',
    unnamed: 'без имени', createdCoins: 'Созданные монеты', activity: 'Активность', noActivity: 'активности пока нет',
    sendTitle: 'Отправить', recipient: 'получатель — адрес или @имя', asset: 'актив',
    sendBtn: 'ОТПРАВИТЬ', recipientFound: '✓ получатель найден', badRecipient: 'получатель не найден',
    enterRecipient: 'укажите получателя', sent: '✓ отправлено',
    commentsTitle: 'Чат · на цепи', saySomething: 'напиши что-нибудь…', post: 'ОТПРАВИТЬ',
    commentFee: '1 GRID за сообщение, сжигается на цепи · попадает в блок',
    noComments: 'сообщений пока нет — напиши первое в блокчейне',
    walletToChat: 'подключи кошелёк, чтобы писать в чат',
    live: 'LIVE', favorites: 'Избранное', favAdd: '★ добавлено в избранное', favRemove: '☆ убрано из избранного',
    top: 'Топ', topTraders: 'Трейдеры', topCreators: 'Создатели', topChatters: 'Болтуны', topCoins: 'Монеты',
    explorer: 'Обозреватель', searchPh: 'блок № / адрес / хэш tx / $ТИКЕР', search: 'ИСКАТЬ',
    block: 'Блок', notFound: 'ничего не найдено', txsN: 'тx', time: 'время',
    limitOrder: 'Лимитный ордер', openOrders: 'Открытые ордера', noOrders: 'ордеров нет', place: 'ВЫСТАВИТЬ',
    side: 'сторона', cancel: 'ОТМЕНИТЬ', atNow: '≈ сейчас', escrowNote: 'средства блокируются на цепи до исполнения или отмены',
    share: 'Поделиться', shareVia: 'Telegram', copyLink: 'скопировать ссылку', ogCard: 'карточка',
    shareMsg: (tk) => `$${tk} торгуется на GRID Chain 🕯️`,
    alert: 'Алерты', alertSet: (pct) => `алерт установлен: ±${pct}%`,
    alertUp: (tk, pct) => `🔥 $${tk} +${pct}%`, alertDown: (tk, pct) => `🧊 $${tk} -${pct}%`,
    avgEntry: 'средняя вход', pnl: 'PnL', value: 'Стоимость', positions: 'Позиции',
    feeNoteTrade: 'комиссия 1%: половина сжигается, половина создателю монеты',
    ach_first_coin: 'первая монета', ach_trader_10: 'деген', ach_trader_100: 'чад-трейдер',
    ach_chatter: 'голос сетки', ach_loud: 'громкоговоритель', ach_whale: 'кит',
    ach_graduator: 'градуатор', ach_collector: 'коллекционер',
    achievements: 'Ачивки',
    nativeCoin: 'Основная монета', buyGrid: 'КУПИТЬ GRID', buyTitle: 'Покупка GRID',
    supply: 'Саплай', inCirculation: 'В обращении', rate: 'Курс',
    rateNotSet: 'курс ещё не установлен — админ задаст цену GRID/USDT',
    chooseCurrency: 'Валюта', payAmount: 'Сумма, USDT', youGet: 'Получишь',
    createRequest: 'СОЗДАТЬ ЗАЯВКУ', memoLabel: 'МЕМО / комментарий — ОБЯЗАТЕЛЬНО',
    sendExactly: 'Отправь сумму на адрес ниже с указанием мемо, затем дождись подтверждения админа.',
    myRequests: 'Мои заявки', pending: 'в обработке', approved: 'выполнена', rejected: 'отклонена',
    depositAddress: 'Адрес для депозита', admin: 'Админ', adminPanel: 'Админ-панель',
    claimAdmin: 'ЗАБРАТЬ ROOT-АДМИНА', claimAdminNote: 'первый, кто заберёт — становится root-админом, навсегда, на цепи',
    grantTitle: 'Выдать GRID', grantAmount: 'сумма на аккаунт', grantBtn: 'ВЫДАТЬ ВЫБРАННЫМ',
    noAccounts: 'аккаунтов пока нет', selected: 'выбрано',
    settingsTitle: 'Настройки', usdtRateLabel: 'Цена GRID в USDT', tonRateLabel: 'Цена GRID в TON', save: 'СОХРАНИТЬ',
    depositsTitle: 'Заявки на покупку', approve: 'ОДОБРИТЬ', reject: 'ОТКЛОНИТЬ',
    noDeposits: 'заявок пока нет', youAreAdmin: 'ты root-админ', notAdmin: 'подключи кошелёк админа',
    login: 'Вход', register: 'Регистрация', username: 'логин', password: 'пароль',
    loginBtn: 'ВОЙТИ', registerBtn: 'СОЗДАТЬ АККАУНТ', logout: 'ВЫЙТИ',
    authNote: 'аккаунт = кошелёк + пароль для восстановления. вход с любого устройства',
    loggedInAs: 'аккаунт', authFailed: 'неверный логин или пароль', userExists: 'логин занят',
    registerOk: '✓ аккаунт создан', regPrompt: 'или создай аккаунт с логином и паролем',
    loginPrompt: 'уже есть аккаунт? войди', accountWallet: 'аккаунт-кошелёк', localWallet: 'локальный кошелёк',
    useAccount: 'ИСПОЛЬЗОВАТЬ АККАУНТ', useLocal: 'ИСПОЛЬЗОВАТЬ ЛОКАЛЬНЫЙ КОШЕЛЁК', twoWallets: 'у тебя есть и локальный кошелёк, и аккаунт — это разные адреса',
    obTagline: 'запускай монеты · торгуй на цепи', guest: 'продолжить без аккаунта →',
    cardStyle: 'карта',
    continueTg: 'ПРОДОЛЖИТЬ С TELEGRAM', continueGoogle: 'ПРОДОЛЖИТЬ С GOOGLE',
    tgOpenNote: 'открой приложение в Telegram для входа в один тап',
    cardsTitle: 'NFT КАРТЫ', mintBtn: 'ОТКРЫТЬ КАРТУ', mintedN: 'открыто',
    myCards: 'Мои карты', market: 'Маркет', equip: 'НАДЕТЬ', equipped: 'НАДЕТА',
    sellCard: 'ПРОДАТЬ', delist: 'СНЯТЬ', buyCard: 'КУПИТЬ', noCards: 'карт пока нет',
    noMarket: 'ничего не выставлено на продажу', cardsNote: '1000 уникальных генеративных паттернов · 500 GRID за минт, сжигается · комиссия маркета 2.5%',
    reveal: 'НАЖМИ, ЧТОБЫ ПРОДОЛЖИТЬ', cardLuck: '🔥 невероятная удача!', cardNice: 'неплохой пулл',
    r_common: 'Обычная', r_rare: 'Редкая', r_epic: 'Эпическая', r_legendary: 'Легендарная',
    needFunds: 'не хватает GRID — фосет или покупка GRID', soldOut: 'все 1000 карт открыты',
    copy: 'копировать', copied: 'скопировано',
    queued: 'в очереди — ждём блок…', confirmed: '✓ подтверждено', stillPending: 'ещё в пути… обновите через момент',
    enterAmount: 'введите сумму', badTicker: 'плохой тикер', nameRequired: 'нужно название',
    notEnoughGrid: 'не хватает GRID — используйте фосет', createdLive: (t) => `✓ $${t} в эфире`,
    walletFirst: 'сначала создайте кошелёк', imported: 'кошелёк импортирован', importFailed: 'импорт не удался (плохой ключ или браузер)',
    footer: 'GRID Chain — тестнет PoA v0.1. Монеты здесь — тестовые очки без стоимости. Каждая сделка — подписанная транзакция в блоке. DYOR.',
  },
  uz: {
    tabCoins: 'TANGALAR', tabTrade: 'SAVDO', tabCreate: 'YARATISH', tabWallet: 'HAMYON',
    block: 'Blok', txs: 'Tranzaksiyalar', coinsN: 'Tangalar', accounts: 'Akkauntlar', volume: 'Hajm',
    latestCells: 'Yangi kataklar', liveFeed: 'Zanjirdan jonli lentа',
    noCoins: 'hali tanga yo‘q — birinchi katak bo‘l', createFirst: 'tanga yaratish',
    waitingTx: 'birinchi tranzaksiyani kutamiz…',
    price: 'Narx', marketCap: 'Bozor qiymati', liquidity: 'Likvidlik', holders: 'Egalar',
    trades: 'Bitimlar', yourBag: 'Portfelingiz', progress: 'Progress', curve: 'egri chiziq',
    graduationAt: 'gradatsiya 10,000 GRID', topHolders: 'Top egalar', noHolders: 'hali egalar yo‘q',
    market: 'Bozor', buy: 'SOTIB OLISH', sell: 'SOTISH', amountGrid: 'summa, GRID', amountTokens: 'miqdor, tanga',
    notEnoughChart: 'bitimlar hali kam',
    launchCoin: 'Tanga ishga tushirish', ticker: 'ticker (2–8, A–Z / 0–9)', name: 'nomi', desc: 'tavsif',
    imageUrl: 'rasm havolasi (ixtiyoriy)', createBtn: 'TANGA YARATISH — 100 GRID TO‘LOV',
    needWallet: 'avval hamyon kerak', createOne: 'yaratish',
    feeNote: 'to‘lov zanjirda kuydiriladi · supply 1,000,000,000 · savdo darhol bonding curve’da boshlanadi',
    yourBalance: 'balansingiz',
    walletTitle: 'Hamyon', keysNote: 'kalitlar faqat brauzeringizda saqlanadi. tugun siringizni ko‘rmaydi.',
    createWallet: 'YANGI HAMYON YARATISH', importSecret: 'MAXFIY KALITNI IMPORT QILISH',
    noWebcrypto: 'brauzerda WebCrypto yo‘q — Telegram yoki zamonaviy brauzerda oching',
    address: 'MANZIL', getTestGrid: 'TEST GRID OLISH', showSecret: 'KALITNI KO‘RSATISH',
    faucetNote: 'fontan: soatiga bir marta 5,000 GRID', neverShare: 'hech kimga bermang — kalitga ega bo‘lgan hamyonga ega bo‘ladi',
    profile: 'Profil', profileName: 'ism (zanjirga yoziladi)', saveName: 'ISMNI SAQLASH',
    unnamed: 'nomsiz', createdCoins: 'Yaratilgan tangalar', activity: 'Faollik', noActivity: 'hali faollik yo‘q',
    sendTitle: 'Yuborish', recipient: 'qabul qiluvchi — manzil yoki @ism', asset: 'aktiv',
    sendBtn: 'YUBORISH', recipientFound: '✓ qabul qiluvchi topildi', badRecipient: 'qabul qiluvchi topilmadi',
    enterRecipient: 'qabul qiluvchini kiriting', sent: '✓ yuborildi',
    commentsTitle: 'Chat · zanjirda', saySomething: 'biror narsa yozing…', post: 'YUBORISH',
    commentFee: 'har xabar 1 GRID, zanjirda kuydiriladi · blokka muhrlanadi',
    noComments: 'xabarlar yo‘q — blokcheynga birinchi bo‘lib yozing',
    walletToChat: 'chat yozish uchun hamyonni ulang',
    live: 'LIVE', favorites: 'Sevimlilar', favAdd: '★ sevimlilarga qo‘shildi', favRemove: '☆ sevimlilardan olindi',
    top: 'Top', topTraders: 'Trederlar', topCreators: 'Yaratuvchilar', topChatters: 'Gapchilar', topCoins: 'Tangalar',
    explorer: 'Explorer', searchPh: 'blok № / manzil / tx hash / $TICKER', search: 'QIDIRISH',
    block: 'Blok', notFound: 'hech narsa topilmadi', txsN: 'tx', time: 'vaqt',
    limitOrder: 'Limit buyurtma', openOrders: 'Ochiq buyurtmalar', noOrders: 'buyurtmalar yo‘q', place: 'QO‘YISH',
    side: 'tomoni', cancel: 'BEKOR QILISH', atNow: '≈ hozir', escrowNote: 'mablag‘lar to‘lguncha zanjirda bloklanadi',
    share: 'Ulashish', shareVia: 'Telegram', copyLink: 'havolani nusxalash', ogCard: 'karta',
    shareMsg: (tk) => `$${tk} GRID Chain’da savdoda 🕯️`,
    alert: 'Ogohlantirish', alertSet: (pct) => `alert o‘rnatildi: ±${pct}%`,
    alertUp: (tk, pct) => `🔥 $${tk} +${pct}%`, alertDown: (tk, pct) => `🧊 $${tk} -${pct}%`,
    avgEntry: 'o‘rtacha kirish', pnl: 'PnL', value: 'Qiymat', positions: 'Pozitsiyalar',
    feeNoteTrade: '1% komissiya: yarimi kuydiriladi, yarimi tanga yaratuvchisiga',
    ach_first_coin: 'birinchi tanga', ach_trader_10: 'degen', ach_trader_100: 'chad treder',
    ach_chatter: 'grid ovozi', ach_loud: 'baland ovozli', ach_whale: 'kit',
    ach_graduator: 'graduator', ach_collector: 'kollektor',
    achievements: 'Yutuqlar',
    nativeCoin: 'Asosiy tanga', buyGrid: 'GRID OLISH', buyTitle: 'GRID sotib olish',
    supply: 'Supply', inCirculation: 'Muomalada', rate: 'Kurs',
    rateNotSet: 'kurs hali o‘rnatilmagan — admin GRID/USDT narxini belgilaydi',
    chooseCurrency: 'Valyuta', payAmount: 'Summa, USDT', youGet: 'Olasiz',
    createRequest: 'SO‘ROV YARATISH', memoLabel: 'MEMO / izoh — MAJBURIY',
    sendExactly: 'Summani quyidagi manzilga memo bilan yuboring, so‘ng admin tasdig‘ini kuting.',
    myRequests: 'Mening so‘rovlarim', pending: 'kutilmoqda', approved: 'bajarildi', rejected: 'rad etildi',
    depositAddress: 'Depozit manzili', admin: 'Admin', adminPanel: 'Admin panel',
    claimAdmin: 'ROOT-ADMIN OLISH', claimAdminNote: 'birinchi olgan wallet root-admin bo‘ladi — abadiy, zanjirda',
    grantTitle: 'GRID berish', grantAmount: 'har akkauntga summa', grantBtn: 'TANLANGANLARGA BERISH',
    noAccounts: 'akkauntlar yo‘q', selected: 'tanlangan',
    settingsTitle: 'Sozlamalar', usdtRateLabel: 'GRID narxi USDTda', tonRateLabel: 'GRID narxi TONda', save: 'SAQLASH',
    depositsTitle: 'Sotib olish so‘rovlari', approve: 'TASDIQLASH', reject: 'RAD ETISH',
    noDeposits: 'so‘rovlar yo‘q', youAreAdmin: 'sen root-adminsan', notAdmin: 'admin hamyonini ulang',
    login: 'Kirish', register: 'Ro‘yxatdan o‘tish', username: 'login', password: 'parol',
    loginBtn: 'KIRISH', registerBtn: 'AKKAUNT YARATISH', logout: 'CHIQISH',
    authNote: 'akkaunt = hamyon + parol bilan zaxira. har qurilmadan kirish',
    loggedInAs: 'akkaunt', authFailed: 'login yoki parol xato', userExists: 'login band',
    registerOk: '✓ akkaunt yaratildi', regPrompt: 'yoki login va parol bilan akkaunt yarating',
    loginPrompt: 'akkauntingiz bormi? kiring', accountWallet: 'akkaunt-hamyon', localWallet: 'lokal hamyon',
    useAccount: 'AKKAUNTDAN FOYDALANISH', useLocal: 'LOKAL HAMYONDAN FOYDALANISH', twoWallets: 'ham lokal hamyon, ham akkaunt bor — bular turli manzillar',
    obTagline: 'tangalarni ishga tushir · zanjirda savdo qil', guest: 'akkauntsiz davom etish →',
    cardStyle: 'karta',
    continueTg: 'TELEGRAM BILAN DAVOM ETISH', continueGoogle: 'GOOGLE BILAN DAVOM ETISH',
    tgOpenNote: 'bir tappa kirish uchun ilovani Telegramda oching',
    cardsTitle: 'NFT KARTALAR', mintBtn: 'KARTA OCHISH', mintedN: 'ochilgan',
    myCards: 'Mening kartalarim', market: 'Bozor', equip: 'KIYISH', equipped: 'KIYILGAN',
    sellCard: 'SOTISH', delist: 'OLIB TASHLASH', buyCard: 'SOTIB OLISH', noCards: 'kartalar yo‘q',
    noMarket: 'sotuvga qo‘yilmagan', cardsNote: '1000 noyob generativ naqsh · mint 500 GRID, kuydiriladi · bozor komissiyasi 2.5%',
    reveal: 'DAVOM ETISH UCHUN BOSING', cardLuck: '🔥 aql bovar qilmaydigan omad!', cardNice: 'yaxshi tushdi',
    r_common: 'Oddiy', r_rare: 'Kamdan-kam', r_epic: 'Epk', r_legendary: 'Afsonaviy',
    needFunds: 'GRID yetmaydi — fontan yoki GRID sotib olish', soldOut: '1000 karta ham ochildi',
    copy: 'nusxalash', copied: 'nusxalandi',
    queued: 'navbatda — blokni kutamiz…', confirmed: '✓ tasdiqlandi', stillPending: 'hali yo‘lda… birozdan keyin yangilang',
    enterAmount: 'summani kiriting', badTicker: 'ticker yomon', nameRequired: 'nom kerak',
    notEnoughGrid: 'GRID yetmaydi — fontandan oling', createdLive: (t) => `✓ $${t} efirda`,
    walletFirst: 'avval hamyon yarating', imported: 'hamyon import qilindi', importFailed: 'import muvaffaqiyatsiz (kalit yoki brauzer yomon)',
    footer: 'GRID Chain — testnet PoA v0.1. Bu yerdagi tangalar qiymatsiz test ochkolari. Har bir bitim — blokqa muhrlangan imzolangan tranzaksiya. DYOR.',
  },
};
const LANGS = ['en', 'ru', 'uz'];
let LANG = localStorage.getItem('gridchain_lang');
if (!LANGS.includes(LANG)) {
  const code = (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe &&
    Telegram.WebApp.initDataUnsafe.user && Telegram.WebApp.initDataUnsafe.user.language_code) ||
    (navigator.language || 'en');
  LANG = code.startsWith('ru') ? 'ru' : code.startsWith('uz') ? 'uz' : 'en';
}
const t = (k) => (I18N[LANG] && I18N[LANG][k] !== undefined ? I18N[LANG][k] : I18N.en[k] ?? k);

// ---------------------------------------------------------------- sounds
let MUTED = localStorage.getItem('gridchain_muted') === '1';
let audioCtx = null;
function beep(freq = 880, dur = 0.07, gain = 0.045) {
  if (MUTED) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    o.type = 'sine';
    g.gain.value = gain;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.stop(audioCtx.currentTime + dur + 0.02);
  } catch {}
}
function pingChat() { beep(880, 0.06); setTimeout(() => beep(1318, 0.09), 75); }
function pingAlert() { beep(660, 0.09, 0.06); setTimeout(() => beep(990, 0.09, 0.06), 100); setTimeout(() => beep(1320, 0.12, 0.06), 200); }
function updateMuteIcon() {
  $('#mute-icon').innerHTML = MUTED
    ? '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m16.5 9.5 5 5M21.5 9.5l-5 5"/>'
    : '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>';
}

// ---------------------------------------------------------------- watchlist & alerts
function watchlist() {
  try { return JSON.parse(localStorage.getItem('gridchain_watchlist') || '[]'); } catch { return []; }
}
function toggleWatch(id) {
  const w = watchlist();
  const added = !w.includes(id);
  const nw = added ? [...w, id] : w.filter((x) => x !== id);
  localStorage.setItem('gridchain_watchlist', JSON.stringify(nw));
  toast(added ? t('favAdd') : t('favRemove'));
  route();
}
function alerts() {
  try { return JSON.parse(localStorage.getItem('gridchain_alerts') || '[]'); } catch { return []; }
}
function setAlert(token, base, pct) {
  const list = alerts().filter((a) => a.token !== token);
  list.push({ token, base, pct });
  localStorage.setItem('gridchain_alerts', JSON.stringify(list));
  toast(t('alertSet')(pct));
}
function checkAlerts(prices) {
  const list = alerts();
  let changed = false;
  for (const a of list) {
    const info = prices[a.token];
    if (!info) continue;
    if (info.p >= a.base * (1 + a.pct / 100)) { toast(t('alertUp')(a.token, a.pct), 4000); pingAlert(); changed = true; }
    else if (info.p <= a.base * (1 - a.pct / 100)) { toast(t('alertDown')(a.token, a.pct), 4000); pingAlert(); changed = true; }
  }
  if (changed) {
    const keep = list.filter((a) => {
      const info = prices[a.token];
      if (!info) return true;
      const up = info.p >= a.base * (1 + a.pct / 100);
      const down = info.p <= a.base * (1 - a.pct / 100);
      return !up && !down;
    });
    localStorage.setItem('gridchain_alerts', JSON.stringify(keep));
  }
}

// ---------------------------------------------------------------- SSE live stream
let softRefreshTimer = null;
function softRefresh() {
  clearTimeout(softRefreshTimer);
  softRefreshTimer = setTimeout(() => {
    if (!typing()) route();
  }, 700);
}
function initStream() {
  try {
    const es = new EventSource('/api/stream');
    es.onmessage = (ev) => {
      let data;
      try { data = JSON.parse(ev.data); } catch { return; }
      if (data.type !== 'block') return;
      const badge = $('#height-badge');
      if (badge) badge.innerHTML = `${t('block')} <b>${data.height}</b> <span class="live-dot"></span>`;
      checkAlerts(data.prices || {});
      const hasChat = (data.feed || []).some((f) => f.summary && f.summary.startsWith('💬'));
      if (hasChat) pingChat();
      softRefresh();
    };
  } catch {}
}

// ---------------------------------------------------------------- helpers
const $ = (s) => document.querySelector(s);
const viewEl = $('#view');

function toast(msg, ms = 2400) {
  const tEl = $('#toast');
  tEl.textContent = msg;
  tEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => tEl.classList.remove('show'), ms);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function fmtNum(n, dp = 2) {
  if (!isFinite(n)) return '—';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: dp });
}
function fmtPrice(p) {
  if (!isFinite(p)) return '—';
  if (p >= 1) return p.toFixed(3);
  return p.toFixed(9).replace(/0+$/, '');
}
function short(addr) { return addr ? addr.slice(0, 10) + '…' + addr.slice(-4) : '—'; }
function ago(ts) {
  const d = Math.max(0, Date.now() - ts) / 1000;
  if (d < 60) return Math.floor(d) + 's';
  if (d < 3600) return Math.floor(d / 60) + 'm';
  return Math.floor(d / 3600) + 'h';
}
function copyText(text) {
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
    .then(() => toast(t('copied')))
    .catch(() => toast(text));
}

// canonical JSON — must match the node exactly (sorted keys, no whitespace)
function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort()
    .map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}
const utf8 = (s) => new TextEncoder().encode(s);
const hexToBytes = (h) => Uint8Array.from(h.match(/.{2}/g).map((b) => parseInt(b, 16)));
const bytesToHex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

async function api(path, opts) {
  const r = await fetch('/api' + path, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
  return j;
}

// ---------------------------------------------------------------- theme
function applyTheme(th) {
  document.documentElement.dataset.theme = th;
  localStorage.setItem('gridchain_theme', th);
  $('#theme-icon').innerHTML = th === 'light'
    ? '<circle cx="12" cy="12" r="4.5"/><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/>'
    : '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>';
}
(function initTheme() {
  let th = localStorage.getItem('gridchain_theme');
  if (th !== 'light' && th !== 'dark') {
    const tgScheme = window.Telegram && Telegram.WebApp && Telegram.WebApp.colorScheme;
    th = tgScheme ? tgScheme : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }
  applyTheme(th);
})();

// ---------------------------------------------------------------- wallet
function loadWallet() {
  try { return JSON.parse(localStorage.getItem('gridchain_wallet')); } catch { return null; }
}
function saveWallet(w) { localStorage.setItem('gridchain_wallet', JSON.stringify(w)); }

async function signWith(secretHex, msgBytes) {
  const algo = { name: 'Ed25519' };
  let key;
  try {
    key = await crypto.subtle.importKey('raw', hexToBytes(secretHex), algo, false, ['sign']);
  } catch {
    const seed = hexToBytes(secretHex);
    const der = new Uint8Array([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20, ...seed]);
    key = await crypto.subtle.importKey('pkcs8', der, algo, false, ['sign']);
  }
  return new Uint8Array(await crypto.subtle.sign(algo, key, msgBytes));
}

// ---------------------------------------------------------------- card skins
const SKINS = [
  { id: 'midnight', css: 'linear-gradient(135deg,#17171a,#0b0b0d 70%)' },
  { id: 'aurora', css: 'linear-gradient(135deg,#241a3e,#2fd97f 160%)' },
  { id: 'gold', css: 'linear-gradient(135deg,#1d1608,#c9a227 170%)' },
  { id: 'carbon', css: 'linear-gradient(135deg,#1a1a1c,#8a1f1f 170%)' },
  { id: 'platinum', css: 'linear-gradient(135deg,#eceef2,#9aa0a8)' },
  { id: 'neon', css: 'linear-gradient(135deg,#03140a,#0f5132 150%)' },
];
function cardSkin() {
  const s = localStorage.getItem('gridchain_skin');
  return SKINS.some((x) => x.id === s) ? s : 'midnight';
}
function setCardSkin(id) {
  localStorage.setItem('gridchain_skin', id);
  route();
}

// ---------------------------------------------------------------- auth
const AUTH = { token: localStorage.getItem('gridchain_token'), me: null };

function walletMode() {
  return localStorage.getItem('gridchain_mode') || 'local'; // 'local' | 'account'
}
function setWalletMode(m) { localStorage.setItem('gridchain_mode', m); }

function currentAccount() {
  const w = loadWallet();
  const mode = walletMode();
  if (mode === 'account' && AUTH.me) return { address: AUTH.me.address, local: false, username: AUTH.me.username };
  if (mode === 'local' && w) return { address: w.address, local: true };
  // no explicit mode — use whatever exists
  if (w) return { address: w.address, local: true };
  if (AUTH.me) return { address: AUTH.me.address, local: false, username: AUTH.me.username };
  return null;
}

// switch to account mode; the old local wallet is kept as a restorable backup
function switchToAccount() {
  const w = loadWallet();
  if (w && !localStorage.getItem('gridchain_wallet_backup')) {
    localStorage.setItem('gridchain_wallet_backup', JSON.stringify(w));
  }
  if (w) localStorage.removeItem('gridchain_wallet');
  setWalletMode('account');
  route();
}
function switchToLocal() {
  const backup = localStorage.getItem('gridchain_wallet_backup');
  if (backup) localStorage.setItem('gridchain_wallet', backup);
  setWalletMode('local');
  route();
}

function requireWallet() {
  const a = currentAccount();
  if (!a) { toast(t('walletFirst')); location.hash = '#/wallet'; return null; }
  return a;
}

async function apiAuth(path, body) {
  return api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + AUTH.token },
    body: JSON.stringify(body || {}),
  });
}

async function sendTx(type, params) {
  const w = loadWallet();
  let tx;
  if (w) {
    const acc = await api('/account/' + w.address);
    tx = { type, from: w.address, nonce: acc.nonce, params, pub: w.public };
    const sig = await signWith(w.secret, utf8(canonical({ type, from: tx.from, nonce: tx.nonce, params })));
    tx.sig = bytesToHex(sig);
    await api('/tx', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tx) });
  } else {
    const a = currentAccount();
    if (!a) { toast(t('walletFirst')); location.hash = '#/wallet'; return null; }
    const r = await apiAuth('/relay', { type, params });
    tx = r.tx;
  }
  toast(t('queued'));
  const from = tx.from;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1200));
    const acc2 = await api('/account/' + from);
    if (acc2.nonce > tx.nonce) { toast(t('confirmed')); return tx; }
  }
  toast(t('stillPending'));
  return tx;
}

// ---------------------------------------------------------------- router
let pollTimer = null;
function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }
function poll(fn, ms = 4000) { stopPoll(); pollTimer = setInterval(fn, ms); }
function typing() { return document.activeElement && viewEl.contains(document.activeElement); }

function setActiveTab(route) {
  document.querySelectorAll('.tab').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === route);
  });
}

async function route() {
  stopPoll();
  // auth gate: first visit without an account or wallet → onboarding screen
  if (!currentAccount() && !localStorage.getItem('gridchain_onboarded')) {
    return renderOnboarding();
  }
  const parts = (location.hash || '#/').slice(2).split('/').filter(Boolean);
  const page = parts[0] || '';
  setActiveTab('/' + page);
  try {
    if (page === '') return await renderHome();
    if (page === 'trade') return await renderTrade(parts[1] ? decodeURIComponent(parts[1]) : null);
    if (page === 'create') return await renderCreate();
    if (page === 'wallet') return await renderWallet();
    if (page === 'profile') return await renderProfile(parts[1] ? decodeURIComponent(parts[1]) : null);
    if (page === 'explorer') return await renderExplorer(parts[1] ? decodeURIComponent(parts[1]) : null);
    if (page === 'buy') return await renderBuy();
    if (page === 'admin') return await renderAdmin();
    if (page === 'cards') return await renderCards();
    if (page === 'coin' && parts[1]) return await renderCoin(decodeURIComponent(parts[1]));
    location.hash = '#/';
  } catch (e) {
    viewEl.innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}
window.addEventListener('hashchange', route);

// Telegram WebApp polish (no-op in a normal browser)
(function () {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready(); tg.expand();
    try { tg.setBackgroundColor('#000000'); tg.setHeaderColor('#000000'); } catch {}
  }
})();

// ---------------------------------------------------------------- onboarding
async function renderOnboarding() {
  document.querySelectorAll('.tab').forEach((el) => el.classList.remove('active'));
  const cfg = await api('/config').catch(() => ({ auth: {} }));
  viewEl.innerHTML = `
    <div class="onboard">
      <div class="ob-logo"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <h1 class="ob-title">GRID&nbsp;CHAIN</h1>
      <p class="ob-tag">${t('obTagline')}</p>
      <div class="panel ob-panel">
        ${cfg.auth && cfg.auth.telegram ? `<button class="btn" id="ob-tg">✈️ ${t('continueTg')}</button>
        <div style="height:10px"></div>` : ''}
        ${cfg.auth && cfg.auth.google ? `<button class="btn ghost" id="ob-google">${t('continueGoogle')}</button>
        <div style="height:14px"></div>` : ''}
        ${authFormsHtml()}
        <div style="height:14px"></div>
        <button class="btn ghost" id="ob-guest">${t('guest')}</button>
      </div>
    </div>`;
  bindAuthForms();
  const tgBtn = $('#ob-tg');
  if (tgBtn) tgBtn.onclick = async () => {
    const tg = window.Telegram && window.Telegram.WebApp;
    if (!tg || !tg.initData) return toast(t('tgOpenNote'));
    try {
      const r = await api('/auth/telegram', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      });
      AUTH.token = r.token;
      AUTH.me = { username: r.username, address: r.address, public: r.public };
      localStorage.setItem('gridchain_token', r.token);
      localStorage.setItem('gridchain_onboarded', '1');
      setWalletMode('account');
      toast('✓ ' + r.username);
      location.hash = '#/';
      route();
    } catch (e) { toast(e.message); }
  };
  const gBtn = $('#ob-google');
  if (gBtn) gBtn.onclick = () => { location.href = '/api/auth/google/start'; };
  $('#ob-guest').onclick = () => {
    localStorage.setItem('gridchain_onboarded', '1');
    location.hash = '#/wallet';
    route();
  };
}

// ---------------------------------------------------------------- NFT cards
function cardFaceHtml(cc, extra = '') {
  return `<div class="nftface r-${esc(cc.rarity)} ${extra}" style="--c1:${cc.c1};--c2:${cc.c2}">
    <span class="nf-glyph">${cc.glyph}</span>
    <span class="nf-num mono">№ ${cc.id}</span>
    <span class="nf-rar">${esc(t('r_' + cc.rarity))}</span>
  </div>`;
}

function equippedCardId() {
  const id = Number(localStorage.getItem('gridchain_card'));
  return id > 0 ? id : null;
}

async function renderCards() {
  const acct = currentAccount();
  const data = await api('/cards' + (acct ? '?owner=' + acct.address : ''));
  const equipped = equippedCardId();
  const pct = Math.round((data.minted / data.total) * 100);

  viewEl.innerHTML = `
    <div class="narrow">
      <div class="sec-title">${t('cardsTitle')} · ${data.minted}/${data.total} ${t('mintedN')}</div>
      <div class="panel" style="margin-bottom:16px">
        <div class="pbar" style="height:8px;background:var(--line-soft);border-radius:4px;position:relative;overflow:hidden;margin-bottom:14px">
          <i style="position:absolute;inset:0 auto 0 0;width:${pct}%;background:var(--fg)"></i>
        </div>
        ${data.minted >= data.total
          ? `<div class="empty">${t('soldOut')}</div>`
          : `<button class="btn" id="mint-btn" ${acct ? '' : 'disabled'}>✦ ${t('mintBtn')} — 500 GRID</button>`}
        <p class="note">${t('cardsNote')}</p>
      </div>
      ${acct ? `
      <div class="sec-title">${t('myCards')}</div>
      ${data.mine.length ? `<div class="nft-grid">${data.mine.map((cc) => `
        <div class="nft-cell">
          ${cardFaceHtml(cc)}
          <div class="nft-actions">
            <button class="btn ${equipped === cc.id ? '' : 'ghost'} nft-eq" data-id="${cc.id}" style="font-size:10px;padding:7px 8px">${equipped === cc.id ? '★ ' + esc(t('equipped')) : esc(t('equip'))}</button>
            ${cc.sale > 0
              ? `<button class="btn ghost nft-dl" data-id="${cc.id}" style="font-size:10px;padding:7px 8px">${esc(t('delist'))}</button>`
              : `<button class="btn ghost nft-sl" data-id="${cc.id}" style="font-size:10px;padding:7px 8px">${esc(t('sellCard'))}</button>`}
          </div>
          ${cc.sale > 0 ? `<div class="nft-price mono">≫ ${fmtNum(cc.sale)} GRID</div>` : ''}
        </div>`).join('')}</div>`
        : `<div class="empty">${t('noCards')}</div>`}` : ''}
      <div class="sec-title">${t('market')}</div>
      ${data.forSale.length ? `<div class="nft-grid">${data.forSale.map((cc) => `
        <div class="nft-cell">
          ${cardFaceHtml(cc)}
          <div class="nft-meta"><a href="#/profile/${esc(cc.owner)}">${esc(cc.ownerName || short(cc.owner))}</a></div>
          <button class="btn nft-buy" data-id="${cc.id}" data-price="${cc.sale}" ${acct ? '' : 'disabled'} style="font-size:10px;padding:7px 8px;margin-top:6px">
            ${esc(t('buyCard'))} · ${fmtNum(cc.sale)} GRID</button>
        </div>`).join('')}</div>`
        : `<div class="empty">${t('noMarket')}</div>`}
    </div>`;

  const mintBtn = $('#mint-btn');
  if (mintBtn) mintBtn.onclick = async () => {
    if (!acct) return;
    const acc = await api('/account/' + acct.address);
    if (acc.grid < 500) return toast(t('needFunds'));
    const before = new Set(data.mine.map((cc) => cc.id));
    const tx = await sendTx('MINT_CARD', {});
    if (!tx) return;
    const after = await api('/cards?owner=' + acct.address);
    const fresh = after.mine.find((cc) => !before.has(cc.id));
    if (fresh) showReveal(fresh);
    else renderCards();
  };
  viewEl.querySelectorAll('.nft-eq').forEach((b) => {
    b.onclick = () => {
      localStorage.setItem('gridchain_card', b.dataset.id);
      toast('★');
      location.hash = '#/wallet';
      route();
    };
  });
  viewEl.querySelectorAll('.nft-sl').forEach((b) => {
    b.onclick = async () => {
      const price = Number(prompt('price, GRID:', '750'));
      if (!(price > 0)) return;
      await sendTx('SELL_CARD', { id: b.dataset.id, price });
      renderCards();
    };
  });
  viewEl.querySelectorAll('.nft-dl').forEach((b) => {
    b.onclick = async () => {
      await sendTx('CANCEL_SALE', { id: b.dataset.id });
      renderCards();
    };
  });
  viewEl.querySelectorAll('.nft-buy').forEach((b) => {
    b.onclick = async () => {
      await sendTx('BUY_CARD', { id: b.dataset.id });
      renderCards();
    };
  });
}

// unboxing: full-screen flip reveal of a freshly minted card
function showReveal(cc) {
  const big = cc.rarity === 'legendary' || cc.rarity === 'epic';
  if (big) pingAlert(); else beep(660, 0.09);
  const ov = document.createElement('div');
  ov.id = 'reveal';
  ov.innerHTML = `
    <div class="rv-flip">
      <div class="rv-inner">
        <div class="rv-back"><span>?</span></div>
        <div class="rv-front">${cardFaceHtml(cc, 'rv')}</div>
      </div>
    </div>
    <p class="rv-luck">${big ? esc(t('cardLuck')) : esc(t('cardNice'))}</p>
    <button class="btn" style="width:auto;padding:10px 26px">${t('reveal')}</button>`;
  ov.addEventListener('click', () => { ov.classList.add('bye'); setTimeout(() => { ov.remove(); renderCards(); }, 300); });
  document.body.appendChild(ov);
}

// ---------------------------------------------------------------- home
async function renderHome() {
  const [stats, tokens, txs, lb, cfg] = await Promise.all([
    api('/stats'), api('/tokens'), api('/txs?limit=14'), api('/leaderboard'), api('/config'),
  ]);
  const watch = watchlist();
  const rate = Number(cfg.config && cfg.config.usdtRate) || 0;
  const cellCard = (tk, starred) => `
    <a class="cell-card" href="#/coin/${esc(tk.id)}">
      ${tk.graduated ? '<span class="grad-flag">GRADUATED</span>' : ''}
      <button class="star ${starred ? 'on' : ''}" data-star="${esc(tk.id)}" title="watchlist">${starred ? '★' : '☆'}</button>
      <div class="tick mono">$${esc(tk.ticker)}</div>
      <div class="nm">${esc(tk.name)}</div>
      <div class="row"><span>${t('price')}</span><b class="mono">${fmtPrice(tk.price)}</b></div>
      <div class="row"><span>${t('volume')}</span><b class="mono">${fmtNum(tk.volume)}</b></div>
      <div class="row"><span>${t('holders')}</span><b class="mono">${tk.holders}</b></div>
      <div class="pbar"><i style="width:${Math.round(tk.progress * 100)}%"></i></div>
    </a>`;
  const favCells = tokens.filter((tk) => watch.includes(tk.id)).map((tk) => cellCard(tk, true)).join('');
  const cells = tokens.filter((tk) => !watch.includes(tk.id)).map((tk) => cellCard(tk, false)).join('');

  const lbRow = (a, metric) => `
    <a class="row" href="#/profile/${esc(a.address)}">
      <span class="s">${esc(a.name || short(a.address))}</span>
      <span class="m mono">${metric}</span>
    </a>`;

  viewEl.innerHTML = `
    <div class="stats">
      <div class="stat"><div class="k">${t('block')}</div><div class="v mono">${stats.height}</div></div>
      <div class="stat"><div class="k">${t('txs')}</div><div class="v mono">${stats.txCount}</div></div>
      <div class="stat"><div class="k">${t('coinsN')}</div><div class="v mono">${stats.tokens}</div></div>
      <div class="stat"><div class="k">${t('accounts')}</div><div class="v mono">${stats.accounts}</div></div>
      <div class="stat"><div class="k">${t('volume')}</div><div class="v mono">${fmtNum(stats.volume, 0)}</div></div>
    </div>
    <div class="grid-hero">
      <div class="gh-left">
        <div class="gh-tag">${t('nativeCoin')}</div>
        <div class="gh-tick mono">GRID</div>
        <div class="gh-rows">
          <div class="row"><span>${t('supply')}</span><b class="mono">100,000,000</b></div>
          <div class="row"><span>${t('inCirculation')}</span><b class="mono">${fmtNum(stats.gridSupply, 0)}</b></div>
          <div class="row"><span>${t('rate')}</span><b class="mono">${rate > 0 ? '1 GRID = ' + rate + ' USDT' : '—'}</b></div>
        </div>
      </div>
      <a class="btn" href="#/buy" style="width:auto;align-self:center;text-decoration:none;display:inline-block">${t('buyGrid')}</a>
    </div>
    ${favCells ? `
    <div class="sec-title">${t('favorites')}</div>
    <div class="cells">${favCells}</div>` : ''}
    <div class="sec-title">${t('latestCells')}</div>
    ${cells ? `<div class="cells">${cells}</div>`
      : `<div class="empty">${t('noCoins')}<br><a style="color:var(--fg);border-bottom:1px solid var(--dim)" href="#/create">${t('createFirst')}</a></div>`}
    <div class="sec-title">// ${t('top')}</div>
    <div class="lb-grid">
      <div><div class="lb-title">${t('topCoins')}</div>
        <div class="feed">${lb.coins.map((c) => `
          <a class="row" href="#/coin/${esc(c.id)}"><span class="s mono">$${esc(c.ticker)}</span>
          <span class="m mono">v${fmtNum(c.volume, 0)}</span></a>`).join('') || `<div class="row"><span class="s">—</span></div>`}</div>
      </div>
      <div><div class="lb-title">${t('topTraders')}</div>
        <div class="feed">${lb.traders.filter(a=>a.vol>0).map((a) => lbRow(a, fmtNum(a.vol, 0))).join('') || `<div class="row"><span class="s">—</span></div>`}</div>
      </div>
      <div><div class="lb-title">${t('topCreators')}</div>
        <div class="feed">${lb.creators.filter(a=>a.tokensCreated>0).map((a) => lbRow(a, a.tokensCreated)).join('') || `<div class="row"><span class="s">—</span></div>`}</div>
      </div>
      <div><div class="lb-title">${t('topChatters')}</div>
        <div class="feed">${lb.chatters.filter(a=>a.comments>0).map((a) => lbRow(a, a.comments)).join('') || `<div class="row"><span class="s">—</span></div>`}</div>
      </div>
    </div>
    <div class="sec-title">${t('liveFeed')}</div>
    <div class="feed">${txs.map((tx) => `
      <div class="row"><span class="s">${esc(tx.summary)}</span><span class="m">${ago(tx.time)}</span></div>`).join('')
      || `<div class="row"><span class="s">${t('waitingTx')}</span></div>`}
    </div>`;
  viewEl.querySelectorAll('[data-star]').forEach((b) => {
    b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); toggleWatch(b.dataset.star); };
  });
  poll(async () => { if (!typing()) route(); });
}

// ---------------------------------------------------------------- trade terminal
async function renderTrade(preselect) {
  const tokens = await api('/tokens');
  if (!tokens.length) {
    viewEl.innerHTML = `<div class="empty">${t('noCoins')} — <a style="color:var(--fg)" href="#/create">${t('createFirst')}</a></div>`;
    return;
  }
  const byVol = [...tokens].sort((a, b) => b.volume - a.volume);
  const id = preselect && tokens.find((x) => x.id === preselect) ? preselect : byVol[0].id;
  const tk = tokens.find((x) => x.id === id);
  const acct = currentAccount();
  const acc = acct ? await api('/account/' + acct.address) : null;
  const held = acc ? (acc.tokens.find((x) => x.id === id) || { amount: 0 }).amount : 0;

  viewEl.innerHTML = `
    <div class="trade-wrap">
      <div class="panel">
        <h3>${t('market')}</h3>
        <div class="feed">${byVol.slice(0, 12).map((x) => `
          <a class="row" href="#/trade/${esc(x.id)}" style="display:flex;justify-content:space-between;gap:10px">
            <span style="font-weight:700" class="mono">$${esc(x.ticker)}</span>
            <span style="color:var(--dim)" class="mono">${fmtPrice(x.price)}</span>
            <span style="color:var(--dim)" class="mono">v${fmtNum(x.volume, 0)}</span>
          </a>`).join('')}</div>
      </div>
      <div>
        <div class="coin-head"><span class="tick mono">$${esc(tk.ticker)}</span><span class="nm">${esc(tk.name)}</span></div>
        <div class="stats" style="margin:16px 0;grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">
          <div class="stat"><div class="k">${t('price')}</div><div class="v mono">${fmtPrice(tk.price)}</div></div>
          <div class="stat"><div class="k">${t('yourBag')}</div><div class="v mono">${fmtNum(held)}</div></div>
          <div class="stat"><div class="k">GRID</div><div class="v mono">${fmtNum(acc ? acc.grid : 0)}</div></div>
          <div class="stat"><div class="k">${t('progress')}</div><div class="v mono">${Math.round(tk.progress * 100)}%</div></div>
        </div>
        <div class="trade-grid">
          <div class="panel">
            <h3>${t('buy')}</h3>
            <div class="field"><label>${t('amountGrid')}</label><input id="buy-amt" type="number" min="1" placeholder="1000"></div>
            <div class="quick">
              <button class="btn ghost" data-q="100">100</button>
              <button class="btn ghost" data-q="1000">1000</button>
              <button class="btn ghost" data-q="10000">10k</button>
            </div>
            <button class="btn" id="buy-btn" style="margin-top:14px">${t('buy')} $${esc(tk.ticker)}</button>
          </div>
          <div class="panel">
            <h3>${t('sell')}</h3>
            <div class="field"><label>${t('amountTokens')}</label><input id="sell-amt" type="number" min="0" placeholder="${Math.floor(held) || 0}"></div>
            <div class="quick">
              <button class="btn ghost" data-sell="0.25">25%</button>
              <button class="btn ghost" data-sell="0.5">50%</button>
              <button class="btn ghost" data-sell="1">100%</button>
            </div>
            <button class="btn ghost" id="sell-btn" style="margin-top:14px">${t('sell')} $${esc(tk.ticker)}</button>
          </div>
        </div>
      </div>
    </div>`;

  $('#buy-btn').onclick = async () => {
    const amt = Number($('#buy-amt').value);
    if (!(amt > 0)) return toast(t('enterAmount'));
    await sendTx('BUY', { token: tk.id, amount: amt });
    route();
  };
  $('#sell-btn').onclick = async () => {
    const amt = Number($('#sell-amt').value);
    if (!(amt > 0)) return toast(t('enterAmount'));
    await sendTx('SELL', { token: tk.id, amount: amt });
    route();
  };
  viewEl.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => { $('#buy-amt').value = b.dataset.q; }; });
  viewEl.querySelectorAll('[data-sell]').forEach((b) => {
    b.onclick = () => { $('#sell-amt').value = Math.floor(held * Number(b.dataset.sell) * 100) / 100; };
  });
}

// ---------------------------------------------------------------- coin page
async function renderCoin(id) {
  const tk = await api('/tokens/' + encodeURIComponent(id));
  const acct = currentAccount();
  const w = loadWallet();
  const acc = acct ? await api('/account/' + acct.address) : null;
  const held = acc ? (acc.tokens.find((x) => x.id === tk.id) || { amount: 0 }).amount : 0;
  const creator = tk.creatorName ? `${esc(tk.creatorName)}` : short(tk.creator);
  const watch = watchlist();

  viewEl.innerHTML = `
    <div class="coin-head"><span class="tick mono">$${esc(tk.ticker)}</span>
      <span class="nm">${esc(tk.name)} · <a href="#/profile/${esc(tk.creator)}" style="color:var(--fg)">${creator}</a></span>
      <span style="margin-left:auto;display:flex;gap:8px">
        <button class="icon-btn star ${watch.includes(tk.id) ? 'on' : ''}" id="coin-star" title="${t('favorites')}">${watch.includes(tk.id) ? '★' : '☆'}</button>
        <button class="icon-btn" id="coin-share" title="${t('share')}">
          <svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.9l7.6-3.8M8.2 13.1l7.6 3.8"/></svg>
        </button>
      </span>
    </div>
    <div class="alert-row" style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span style="font-size:10px;color:var(--dim);letter-spacing:.14em;text-transform:uppercase;font-weight:600">🔔 ${t('alert')}</span>
      ${[25, 50, 100].map((pct) => `<button class="btn ghost alert-btn" data-pct="${pct}" style="width:auto;padding:5px 12px;font-size:11px">±${pct}%</button>`).join('')}
    </div>
    ${tk.desc ? `<p style="color:var(--dim);font-size:13px;margin-top:8px;max-width:640px">${esc(tk.desc)}</p>` : ''}
    <div class="stats" style="margin:16px 0">
      <div class="stat"><div class="k">${t('price')}</div><div class="v mono">${fmtPrice(tk.price)}</div></div>
      <div class="stat"><div class="k">${t('marketCap')}</div><div class="v mono">${fmtNum(tk.marketCap, 0)}</div></div>
      <div class="stat"><div class="k">${t('liquidity')}</div><div class="v mono">${fmtNum(tk.liquidity, 0)}</div></div>
      <div class="stat"><div class="k">${t('holders')}</div><div class="v mono">${tk.holders.length}</div></div>
      <div class="stat"><div class="k">${t('trades')}</div><div class="v mono">${tk.trades}</div></div>
      <div class="stat"><div class="k">${t('yourBag')}</div><div class="v mono">${fmtNum(held)}</div></div>
    </div>
    <div style="max-width:640px">
      <div class="pbar" style="height:8px;background:var(--line-soft);border-radius:4px;position:relative;overflow:hidden">
        <i style="position:absolute;inset:0 auto 0 0;width:${Math.round(tk.progress * 100)}%;background:var(--fg)"></i>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--dim);margin-top:6px">
        <span>${t('curve')} ${Math.round(tk.progress * 100)}%</span><span>${t('graduationAt')}</span>
      </div>
    </div>
    <div class="chart-box"><canvas id="chart"></canvas></div>
    <div class="trade-grid">
      <div class="panel">
        <h3>${t('buy')}</h3>
        <div class="field"><label>${t('amountGrid')}</label><input id="buy-amt" type="number" min="1" placeholder="1000"></div>
        <button class="btn" id="buy-btn">${t('buy')}</button>
      </div>
      <div class="panel">
        <h3>${t('sell')}</h3>
        <div class="field"><label>${t('amountTokens')}</label><input id="sell-amt" type="number" min="0" placeholder="${Math.floor(held) || 0}"></div>
        <button class="btn ghost" id="sell-btn">${t('sell')}</button>
      </div>
      <div class="panel" style="grid-column:1/-1">
        <h3>${t('limitOrder')}</h3>
        <div class="trade-grid" style="gap:10px">
          <div class="field"><label>${t('side')}</label>
            <select id="lo-side"><option value="buy">${t('buy')}</option><option value="sell">${t('sell')}</option></select></div>
          <div class="field"><label id="lo-amt-label">${t('amountGrid')}</label><input id="lo-amt" type="number" min="0" placeholder="0"></div>
          <div class="field"><label>${t('price')} <button class="mini-link" id="lo-now" type="button">${t('atNow')}</button></label>
            <input id="lo-price" class="mono" type="number" min="0" step="any" placeholder="0.000001"></div>
        </div>
        <button class="btn ghost" id="lo-btn" style="margin-top:6px">${t('place')}</button>
        <p class="note">${t('escrowNote')} · ${t('feeNoteTrade')}</p>
      </div>
    </div>
    ${(tk.orders || []).length ? `
    <div class="sec-title">${t('openOrders')}</div>
    <div class="feed" style="max-width:640px">${tk.orders.map((o) => `
      <div class="row">
        <span class="s"><span class="side-tag ${o.side}">${o.side === 'buy' ? t('buy') : t('sell')}</span>
          ${fmtNum(o.amount, 4)} @ <span class="mono">${fmtPrice(o.price)}</span>
          <span style="color:var(--dim)">· ${o.name ? esc(o.name) : short(o.from)}</span></span>
        ${acct && o.from === acct.address ? `<button class="btn ghost cancel-btn" data-oid="${esc(o.id)}" style="width:auto;padding:4px 10px;font-size:10px">${t('cancel')}</button>` : ''}
      </div>`).join('')}</div>` : ''}
    <div class="sec-title">${t('topHolders')}</div>
    <div class="holders" style="max-width:640px">${tk.holders.map((h) => `
      <div class="row">
        <span class="a"><a href="#/profile/${esc(h.address)}" style="color:var(--dim)">${h.name ? esc(h.name) : esc(h.address)}</a></span>
        <span class="mono">${fmtNum(h.amount)}</span>
      </div>`).join('') || `<div class="row"><span class="a">${t('noHolders')}</span></div>`}
    </div>
    <div class="sec-title">${t('commentsTitle')}</div>
    <div class="chat" style="max-width:640px">
      ${(tk.comments || []).slice().reverse().map((c) => `
        <div class="msg">
          <div class="meta">
            <a href="#/profile/${esc(c.from)}">${c.name ? esc(c.name) : short(c.from)}</a>
            <span>${ago(c.time)}</span>
          </div>
          <div class="body">${esc(c.text)}</div>
        </div>`).join('') || `<div class="msg"><div class="body" style="color:var(--dim)">${t('noComments')}</div></div>`}
    </div>
    ${acct ? `
    <div class="chat-input" style="max-width:640px">
      <input id="cm-text" maxlength="200" placeholder="${esc(t('saySomething'))}">
      <button class="btn" id="cm-btn" style="width:auto;padding:10px 18px">${t('post')}</button>
    </div>
    <p class="note" style="max-width:640px">${t('commentFee')}</p>` : `
    <p class="note" style="max-width:640px">${t('walletToChat')} — <a href="#/wallet" style="color:var(--fg)">${t('createOne')}</a></p>`}
  `;

  drawCandles($('#chart'), tk.history);
  $('#buy-btn').onclick = async () => {
    const amt = Number($('#buy-amt').value);
    if (!(amt > 0)) return toast(t('enterAmount'));
    await sendTx('BUY', { token: tk.id, amount: amt });
    route();
  };
  $('#sell-btn').onclick = async () => {
    const amt = Number($('#sell-amt').value);
    if (!(amt > 0)) return toast(t('enterAmount'));
    await sendTx('SELL', { token: tk.id, amount: amt });
    route();
  };
  const cmBtn = $('#cm-btn');
  if (cmBtn) {
    cmBtn.onclick = async () => {
      const text = $('#cm-text').value.trim();
      if (!text) return;
      $('#cm-text').value = '';
      await sendTx('COMMENT', { token: tk.id, text });
      renderCoin(id);
    };
    $('#cm-text').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') cmBtn.click();
    });
  }
  // watchlist star
  $('#coin-star').onclick = () => toggleWatch(tk.id);
  // alerts
  viewEl.querySelectorAll('.alert-btn').forEach((b) => {
    b.onclick = () => setAlert(tk.id, tk.price, Number(b.dataset.pct));
  });
  // share
  $('#coin-share').onclick = () => {
    const url = location.origin + '/#/coin/' + tk.id;
    const tg = window.Telegram && window.Telegram.WebApp;
    if (tg && tg.openTelegramLink) {
      tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(t('shareMsg')(tk.ticker)));
    } else {
      window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(t('shareMsg')(tk.ticker)), '_blank');
    }
  };
  // limit orders
  $('#lo-side').onchange = () => {
    $('#lo-amt-label').textContent = $('#lo-side').value === 'buy' ? t('amountGrid') : t('amountTokens');
  };
  $('#lo-now').onclick = () => { $('#lo-price').value = tk.price; };
  $('#lo-btn').onclick = async () => {
    const side = $('#lo-side').value;
    const amount = Number($('#lo-amt').value);
    const price = Number($('#lo-price').value);
    if (!(amount > 0)) return toast(t('enterAmount'));
    if (!(price > 0)) return toast(t('enterAmount'));
    await sendTx('ORDER', { token: tk.id, side, amount, price });
    renderCoin(id);
  };
  viewEl.querySelectorAll('.cancel-btn').forEach((b) => {
    b.onclick = async () => {
      await sendTx('CANCEL_ORDER', { token: tk.id, id: b.dataset.oid });
      renderCoin(id);
    };
  });
  poll(async () => { if (!typing()) { try { await renderCoin(id); } catch {} } }, 6000);
}

function drawCandles(canvas, history) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 600, h = 240;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  const css = getComputedStyle(document.documentElement);
  const fg = css.getPropertyValue('--fg').trim() || '#fff';
  const dim = css.getPropertyValue('--dim').trim() || '#8a8a8a';
  const gridC = css.getPropertyValue('--chart-grid').trim() || 'rgba(255,255,255,.06)';
  const UP = '#2fd97f', DOWN = '#ff5252';

  const pts = history.filter((x) => x && x.p > 0);
  if (pts.length < 2) {
    ctx.fillStyle = dim; ctx.font = '13px sans-serif';
    ctx.fillText(t('notEnoughChart'), 16, h / 2);
    return;
  }

  // bucket consecutive trades into candles (adaptive, ≤ 36 candles)
  const MAX_CANDLES = 36;
  const per = Math.max(1, Math.ceil(pts.length / MAX_CANDLES));
  const candles = [];
  for (let i = 0; i < pts.length; i += per) {
    const slice = pts.slice(i, i + per);
    const ps = slice.map((x) => x.p);
    candles.push({
      o: ps[0], c: ps[ps.length - 1],
      h: Math.max(...ps), l: Math.min(...ps),
      v: slice.reduce((n, x) => n + (x.v || 0), 0),
      t: slice[0].t,
    });
  }

  const padL = 8, padR = 56, padT = 12;
  const priceH = (h - padT - 26) * 0.76;
  const volTop = padT + priceH + 14;
  const volH = h - volTop - 18;
  let lo = Math.min(...candles.map((c) => c.l));
  let hi = Math.max(...candles.map((c) => c.h));
  const range = (hi - lo) || hi * 0.1 || 1;
  lo -= range * 0.06; hi += range * 0.06;
  const maxVol = Math.max(...candles.map((c) => c.v), 1);
  const plotW = w - padL - padR;
  const slot = plotW / candles.length;
  const Y = (p) => padT + (1 - (p - lo) / (hi - lo)) * priceH;
  const XV = (v) => volH * (v / maxVol);

  // grid + y labels
  ctx.strokeStyle = gridC; ctx.fillStyle = dim; ctx.lineWidth = 1;
  ctx.font = '10px ui-monospace, monospace';
  for (let i = 0; i <= 4; i++) {
    const p = lo + ((hi - lo) * i) / 4;
    const y = Y(p);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.fillText(fmtPrice(p), w - padR + 6, y + 3);
  }

  candles.forEach((c, i) => {
    const x = padL + slot * i + slot / 2;
    const up = c.c >= c.o;
    const col = up ? UP : DOWN;
    // volume bar
    ctx.fillStyle = col + '55';
    const bw = Math.max(2, slot * 0.62);
    ctx.fillRect(x - bw / 2, h - 18 - XV(c.v), bw, XV(c.v));
    // wick
    ctx.strokeStyle = col; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, Y(c.h)); ctx.lineTo(x, Y(c.l)); ctx.stroke();
    // body
    const by1 = Y(Math.max(c.o, c.c));
    const by2 = Y(Math.min(c.o, c.c));
    const bodyH = Math.max(1.4, by2 - by1);
    ctx.fillStyle = col;
    ctx.fillRect(x - bw / 2, by1, bw, bodyH);
  });

  // last price line + tag
  const last = candles[candles.length - 1];
  const ly = Y(last.c);
  const lcol = last.c >= last.o ? UP : DOWN;
  ctx.strokeStyle = lcol; ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(padL, ly); ctx.lineTo(w - padR, ly); ctx.stroke();
  ctx.setLineDash([]);
  const label = fmtPrice(last.c);
  ctx.font = '700 10px ui-monospace, monospace';
  const tw = ctx.measureText(label).width + 10;
  ctx.fillStyle = lcol;
  roundRect(ctx, w - padR + 2, ly - 8, Math.max(tw, padR - 6), 16, 4);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.fillText(label, w - padR + 8, ly + 3);

  // x labels
  ctx.fillStyle = dim;
  ctx.font = '10px ui-monospace, monospace';
  const t0 = new Date(pts[0].t), t1 = new Date(pts[pts.length - 1].t);
  const hm = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  ctx.fillText(hm(t0), padL, h - 4);
  const mid = hm(new Date((pts[0].t + pts[pts.length - 1].t) / 2));
  ctx.fillText(mid, padL + plotW / 2 - 12, h - 4);
  ctx.fillText(hm(t1), w - padR - 26, h - 4);
}

function roundRect(ctx, x, y, w2, h2, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w2, y, x + w2, y + h2, r);
  ctx.arcTo(x + w2, y + h2, x, y + h2, r);
  ctx.arcTo(x, y + h2, x, y, r);
  ctx.arcTo(x, y, x + w2, y, r);
  ctx.closePath();
}

// ---------------------------------------------------------------- create
async function renderCreate() {
  const acct = currentAccount();
  const acc = acct ? await api('/account/' + acct.address) : null;
  viewEl.innerHTML = `
    <div class="narrow">
      <div class="sec-title">${t('launchCoin')}</div>
      <div class="panel">
        ${!acct ? `<p class="note" style="margin-bottom:14px">${t('needWallet')} — <a href="#/wallet" style="color:var(--fg)">${t('createOne')}</a></p>` : ''}
        <div class="field"><label>${t('ticker')}</label><input id="c-tick" class="mono" maxlength="8" placeholder="MOON"></div>
        <div class="field"><label>${t('name')}</label><input id="c-name" maxlength="40" placeholder="Moon Coin"></div>
        <div class="field"><label>${t('desc')}</label><textarea id="c-desc" maxlength="200" rows="3" placeholder="to the moon and back"></textarea></div>
        <div class="field"><label>${t('imageUrl')}</label><input id="c-img" maxlength="300" placeholder="https://…"></div>
        <button class="btn" id="c-btn" ${acct ? '' : 'disabled'}>${t('createBtn')}</button>
        <p class="note">${t('feeNote')}${acc ? ` · ${t('yourBalance')}: <b class="mono">${fmtNum(acc.grid)}</b> GRID` : ''}</p>
      </div>
    </div>`;
  $('#c-btn').onclick = async () => {
    const ticker = $('#c-tick').value.trim().toUpperCase();
    const name = $('#c-name').value.trim();
    if (!/^[A-Z0-9]{2,8}$/.test(ticker)) return toast(t('badTicker'));
    if (!name) return toast(t('nameRequired'));
    if (acc && acc.grid < 100) return toast(t('notEnoughGrid'));
    const tx = await sendTx('CREATE_TOKEN', { ticker, name, desc: $('#c-desc').value.trim(), image: $('#c-img').value.trim() });
    if (tx) { toast(t('createdLive')(ticker)); location.hash = '#/coin/' + ticker; }
  };
}

// ---------------------------------------------------------------- wallet
function authFormsHtml() {
  return `
    <h3>${t('register')}</h3>
    <p class="note" style="margin-bottom:14px">${t('authNote')}</p>
    <div class="field"><label>${t('username')}</label><input id="r-user" maxlength="24" placeholder="satoshi_vibes"></div>
    <div class="field"><label>${t('password')}</label><input id="r-pass" type="password" placeholder="••••••"></div>
    <button class="btn" id="r-btn">${t('registerBtn')}</button>
    <div style="height:14px"></div>
    <h3>${t('login')}</h3>
    <div class="field"><label>${t('username')}</label><input id="l-user" maxlength="24"></div>
    <div class="field"><label>${t('password')}</label><input id="l-pass" type="password"></div>
    <button class="btn ghost" id="l-btn">${t('loginBtn')}</button>`;
}

function bindAuthForms() {
  $('#r-btn').onclick = async () => {
    const username = $('#r-user').value.trim();
    const password = $('#r-pass').value;
    if (username.length < 3) return toast(t('userExists'));
    if (password.length < 6) return toast(t('authFailed'));
    try {
      const r = await api('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      AUTH.token = r.token;
      AUTH.me = { username: r.username, address: r.address, public: r.public };
      localStorage.setItem('gridchain_token', r.token);
      localStorage.setItem('gridchain_onboarded', '1');
      toast(t('registerOk') + ' — ' + r.username);
      switchToAccount();
    } catch (e) { toast(e.message === 'username already taken' ? t('userExists') : e.message); }
  };
  $('#l-btn').onclick = async () => {
    const username = $('#l-user').value.trim();
    const password = $('#l-pass').value;
    try {
      const r = await api('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      AUTH.token = r.token;
      AUTH.me = { username: r.username, address: r.address, public: r.public };
      localStorage.setItem('gridchain_token', r.token);
      localStorage.setItem('gridchain_onboarded', '1');
      toast('✓ ' + r.username);
      switchToAccount();
    } catch { toast(t('authFailed')); }
  };
}

async function renderWallet() {
  const w = loadWallet();
  const acct = currentAccount();
  if (!acct) {
    viewEl.innerHTML = `
      <div class="narrow">
        <div class="sec-title">${t('walletTitle')}</div>
        <div class="panel" style="margin-bottom:14px">
          <p class="note" style="margin-bottom:16px">${t('keysNote')}</p>
          <button class="btn" id="w-new">${t('createWallet')}</button>
          <div style="height:10px"></div>
          <button class="btn ghost" id="w-import">${t('importSecret')}</button>
          <p class="note" id="ed-note"></p>
        </div>
        <div class="panel">${authFormsHtml()}</div>
      </div>`;
    $('#w-new').onclick = async () => {
      const kp = await api('/wallet/new', { method: 'POST', body: '{}' });
      saveWallet(kp);
      setWalletMode('local');
      toast(t('confirmed'));
      renderWallet();
    };
    $('#w-import').onclick = async () => {
      const secret = prompt('secret (64 hex chars):');
      if (!secret) return;
      try {
        const key = await crypto.subtle.importKey('raw', hexToBytes(secret.trim()), { name: 'Ed25519' }, true, ['sign']);
        const jwk = await crypto.subtle.exportKey('jwk', key);
        if (!jwk.x) throw new Error('bad key');
        const pubHex = base64ToHex(jwk.x);
        const { address } = await api('/address-of/' + pubHex);
        saveWallet({ address, public: pubHex, secret: secret.trim() });
        setWalletMode('local');
        toast(t('imported'));
        renderWallet();
      } catch { toast(t('importFailed')); }
    };
    $('#ed-note').textContent = (window.crypto && crypto.subtle) ? '' : t('noWebcrypto');
    bindAuthForms();
    return;
  }

  const addr = acct.address;
  const acc = await api('/account/' + addr);
  const cfg = await api('/config');
  const usdtEq = acc.grid * (Number(cfg.config && cfg.config.usdtRate) || 0);
  const tonEq = acc.grid * (Number(cfg.config && cfg.config.tonRate) || 0);
  // equipped NFT card overrides the free skin
  let nft = null;
  const eqId = equippedCardId();
  if (eqId) {
    const cards = await api('/cards?owner=' + addr).catch(() => null);
    nft = cards ? cards.mine.find((cc) => cc.id === eqId) : null;
    if (!nft) localStorage.removeItem('gridchain_card');
  }
  const skinCls = nft ? 'skin-nft' : 'skin-' + cardSkin();
  const nftStyle = nft ? `--c1:${nft.c1};--c2:${nft.c2}` : '';
  const prices = {};
  try {
    for (const tkn of await api('/tokens')) prices[tkn.id] = tkn.price;
  } catch {}
  const posEntries = Object.entries(acc.positions || {}).filter(([, p]) => p.amount > 0);
  const posRows = posEntries.map(([tid, p]) => {
    const price = prices[tid] || 0;
    const value = price * p.amount;
    const cost = p.avg * p.amount;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? ((value / cost) - 1) * 100 : 0;
    const tkn = acc.tokens.find((x) => x.id === tid);
    return `<div class="row">
      <span><a href="#/coin/${esc(tid)}" style="color:var(--fg)" class="mono">$${esc(tkn ? tkn.ticker : tid)}</a>
        <span style="color:var(--dim);font-size:11px"> · ${t('avgEntry')} <span class="mono">${fmtPrice(p.avg)}</span></span></span>
      <b class="mono ${pnl >= 0 ? '' : 'neg'}" style="text-align:right">
        ${fmtNum(pnl, 2)} GRID<br><span style="font-size:10px;color:var(--dim)">${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}% · ${fmtNum(p.amount, 0)} tk</span></b>
    </div>`;
  }).join('');
  viewEl.innerHTML = `
    <div class="narrow">
      <div class="pay-card ${skinCls}" style="${nftStyle}">
        ${nft ? `<span class="pc-watermark">${nft.glyph}</span>` : ''}
        <div class="pc-top">
          <span class="pc-brand"><span class="mini-grid"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>GRID</span>
          <span class="pc-mode">${nft ? `<span class="rar-tag r-${nft.rarity}">NFT №${nft.id} · ${esc(t('r_' + nft.rarity))}</span>` : (acct.username ? '@' + esc(acct.username) : esc(t('localWallet')))}</span>
        </div>
        <div class="pc-bal mono">${fmtNum(acc.grid, 4)}</div>
        <div class="pc-unit">GRID</div>
        ${(usdtEq > 0 || tonEq > 0) ? `
        <div class="pc-equiv">
          ${usdtEq > 0 ? `<span>≈ <b class="mono">${fmtNum(usdtEq, 2)}</b> USDT</span>` : ''}
          ${tonEq > 0 ? `<span>≈ <b class="mono">${fmtNum(tonEq, 3)}</b> TON</span>` : ''}
        </div>` : ''}
        <div class="pc-bottom">
          <button class="pc-addr mono" id="pc-copy" title="${t('copy')}">${short(addr)} ⧉</button>
          <span class="pc-net"><span class="live-dot"></span>GRID CHAIN</span>
        </div>
      </div>
      <div class="skin-row">
        <span class="sk-label">${t('cardStyle')}</span>
        ${SKINS.map((s) => `<button class="skin-dot ${!nft && cardSkin() === s.id ? 'on' : ''}" data-skin="${s.id}" style="background:${s.css}" title="${s.id}"></button>`).join('')}
        <a class="btn ghost" href="#/cards" style="width:auto;margin-left:auto;padding:5px 12px;font-size:10px">✦ ${t('cardsTitle')}</a>
      </div>
      ${acc.tokens.length ? `
      <div class="chip-row">
        ${acc.tokens.map((tk) => `<a class="chip" href="#/coin/${esc(tk.id)}"><b class="mono">$${esc(tk.ticker || tk.id)}</b><span class="mono">${fmtNum(tk.amount, 0)}</span></a>`).join('')}
      </div>` : ''}
      ${posRows ? `
      <div class="sec-title">${t('positions')}</div>
      <div class="bal-list" id="pnl-list">${posRows}</div>` : ''}
      <div class="panel" style="margin-top:18px">
        <h3>${t('sendTitle')}</h3>
        <div class="field">
          <label>${t('asset')}</label>
          <select id="s-asset">
            <option value="GRID" data-max="${acc.grid}">GRID — ${fmtNum(acc.grid, 4)}</option>
            ${acc.tokens.map((tk) => `<option value="${esc(tk.id)}" data-max="${tk.amount}">$${esc(tk.ticker || tk.id)} — ${fmtNum(tk.amount)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>${t('recipient')}</label><input id="s-to" placeholder="grid1… / @name"></div>
        <div class="field"><label>${t('amountGrid')}</label><input id="s-amt" type="number" min="0" placeholder="0.0"></div>
        <button class="btn" id="s-btn">${t('sendBtn')}</button>
      </div>
      <div class="quick" style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button class="btn" id="w-faucet">${t('getTestGrid')}</button>
        ${w ? `<button class="btn ghost" id="w-show">${t('showSecret')}</button>` : ''}
      </div>
      <p class="note">${t('faucetNote')}</p>
      <div class="sec-title">${t('login')} / ${t('register')}</div>
      <div class="panel">
        ${AUTH.me ? `
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span class="tag">${t('loggedInAs')}: <b>${esc(AUTH.me.username)}</b></span>
            <button class="btn ghost" id="w-logout" style="width:auto;padding:6px 14px;font-size:11px">${t('logout')}</button>
          </div>
          ${localStorage.getItem('gridchain_wallet_backup') ? `
            <p class="note">${t('twoWallets')}</p>
            ${w ? `<button class="btn ghost" id="w-use-acct" style="margin-top:10px">${t('useAccount')}</button>`
                : `<button class="btn ghost" id="w-use-local" style="margin-top:10px">${t('useLocal')}</button>`}` : ''}`
          : authFormsHtml()}
      </div>
    </div>`;
  $('#pc-copy').onclick = () => copyText(addr);
  viewEl.querySelectorAll('.skin-dot').forEach((b) => {
    b.onclick = () => setCardSkin(b.dataset.skin);
  });
  const lo = $('#w-logout');
  if (lo) lo.onclick = async () => {
    try { await apiAuth('/auth/logout', {}); } catch {}
    AUTH.token = null;
    AUTH.me = null;
    localStorage.removeItem('gridchain_token');
    toast('👋');
    renderWallet();
  };
  const ua = $('#w-use-acct');
  if (ua) ua.onclick = switchToAccount;
  const ul = $('#w-use-local');
  if (ul) ul.onclick = switchToLocal;
  if (!AUTH.me) bindAuthForms();

  async function resolveRecipient(raw) {
    raw = raw.trim();
    if (/^grid1[0-9a-f]{40}$/.test(raw)) return raw;
    const name = raw.replace(/^@/, '');
    if (!name) return null;
    try {
      const r = await api('/resolve/' + encodeURIComponent(name));
      toast(t('recipientFound') + ': ' + (r.name || ''));
      return r.address;
    } catch { return null; }
  }

  $('#s-btn').onclick = async () => {
    const asset = $('#s-asset').value;
    const amt = Number($('#s-amt').value);
    if (!(amt > 0)) return toast(t('enterAmount'));
    const rawTo = $('#s-to').value;
    if (!rawTo) return toast(t('enterRecipient'));
    const to = await resolveRecipient(rawTo);
    if (!to) return toast(t('badRecipient'));
    if (asset === 'GRID') {
      await sendTx('TRANSFER', { to, amount: amt });
    } else {
      await sendTx('TOKEN_TRANSFER', { token: asset, to, amount: amt });
    }
    toast(t('sent'));
    renderWallet();
  };
  $('#w-faucet').onclick = async () => {
    try {
      await api('/faucet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addr }) });
      toast(t('queued'));
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 1200));
        const a = await api('/account/' + addr);
        if (a.grid > 0) { toast(t('confirmed')); return renderWallet(); }
      }
      toast(t('stillPending'));
    } catch (e) { toast(e.message); }
  };
  const showBtn = $('#w-show');
  if (showBtn && w) {
    showBtn.onclick = () => {
      const p = document.createElement('p');
      p.className = 'note';
      p.innerHTML = `<span class="secret mono">${esc(w.secret)}</span><br>${t('neverShare')}`;
      p.style.marginTop = '12px';
      showBtn.replaceWith(p);
    };
  } else if (showBtn) {
    showBtn.style.display = 'none';
  }
}

// ---------------------------------------------------------------- profile
async function renderProfile(address) {
  const own = loadWallet();
  const addr = address || (own ? own.address : null);
  if (!addr) {
    viewEl.innerHTML = `<div class="narrow"><div class="sec-title">${t('profile')}</div>
      <div class="empty">${t('needWallet')} — <a href="#/wallet" style="color:var(--fg)">${t('createOne')}</a></div></div>`;
    return;
  }
  const [prof, acc, cfg] = await Promise.all([api('/profile/' + addr), api('/account/' + addr), api('/config')]);
  const isOwn = own && own.address === addr;
  const isAdmin = cfg.admin === addr;
  const initial = (prof.name || '?').slice(0, 1).toUpperCase();

  viewEl.innerHTML = `
    <div class="narrow">
      <div class="sec-title">${t('profile')}</div>
      <div class="avatar">${esc(prof.name ? initial : 'Ø')}</div>
      <div class="addr-box" style="margin-bottom:8px">
        <div class="k">${esc(prof.name || t('unnamed'))} ${isOwn ? '<span class="tag">YOU</span>' : ''} ${isAdmin ? '<a href="#/admin" style="color:var(--up)">⚡ ' + esc(t('admin')) + '</a>' : ''}</div>
        <span class="mono" style="color:var(--dim)">${esc(addr)}</span>
        <button class="btn ghost" style="width:auto;padding:4px 12px;margin-top:10px;font-size:11px" id="p-copy">${t('copy')}</button>
      </div>
      ${isOwn ? `
      <div class="panel" style="margin-bottom:16px">
        <div class="field"><label>${t('profileName')}</label>
          <input id="p-name" maxlength="24" value="${esc(prof.name || '')}" placeholder="${esc(t('unnamed'))}"></div>
        <button class="btn" id="p-save">${t('saveName')}</button>
      </div>` : ''}
      <div class="stats" style="margin:16px 0">
        <div class="stat"><div class="k">GRID</div><div class="v mono">${fmtNum(acc.grid, 4)}</div></div>
        <div class="stat"><div class="k">${t('coinsN')}</div><div class="v mono">${prof.created.length}</div></div>
        <div class="stat"><div class="k">${t('holders')}</div><div class="v mono">${acc.tokens.length}</div></div>
        ${prof.stats ? `<div class="stat"><div class="k">${t('pnl')} · realized</div><div class="v mono ${prof.stats.realized >= 0 ? '' : 'neg'}">${fmtNum(prof.stats.realized, 2)}</div></div>` : ''}
      </div>
      ${(prof.achievements || []).length ? `
      <div class="sec-title">${t('achievements')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
        ${prof.achievements.map((k) => `<span class="badge">🏅 ${esc(t('ach_' + k))}</span>`).join('')}
      </div>` : ''}
      ${prof.created.length ? `
      <div class="sec-title">${t('createdCoins')}</div>
      <div class="cells">${prof.created.map((tk) => `
        <a class="cell-card" href="#/coin/${esc(tk.id)}">
          <div class="tick mono">$${esc(tk.ticker)}</div>
          <div class="nm">${esc(tk.name)}</div>
          <div class="row"><span>${t('price')}</span><b class="mono">${fmtPrice(tk.price)}</b></div>
          <div class="pbar"><i style="width:${Math.round(tk.progress * 100)}%"></i></div>
        </a>`).join('')}</div>` : ''}
      <div class="sec-title">${t('activity')}</div>
      <div class="feed">${prof.activity.map((tx) => `
        <div class="row"><span class="s">${esc(tx.summary)}</span><span class="m">${ago(tx.time)}</span></div>`).join('')
        || `<div class="row"><span class="s">${t('noActivity')}</span></div>`}
      </div>
    </div>`;

  $('#p-copy').onclick = () => copyText(addr);
  if (isOwn) {
    $('#p-save').onclick = async () => {
      const name = $('#p-name').value.replace(/\s+/g, ' ').trim();
      if (!name) return toast(t('nameRequired'));
      await sendTx('PROFILE', { name });
      renderProfile(addr);
    };
  }
}

function base64ToHex(b64) {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  return [...bin].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- explorer
async function renderExplorer(query) {
  const blocks = await api('/blocks?limit=20');
  let detail = '';
  if (query) {
    const q = query.trim();
    if (/^\d+$/.test(q)) {
      const b = await api('/block/' + q).catch(() => null);
      detail = b ? blockDetailHtml(b) : `<div class="empty">${t('notFound')}</div>`;
    } else if (/^grid1[0-9a-f]{40}$/.test(q)) {
      const p = await api('/profile/' + q).catch(() => null);
      detail = p ? `<div class="empty" style="text-align:left">
        <a href="#/profile/${esc(q)}" style="color:var(--fg)">${esc(p.name || q)}</a> → #/profile</div>` : `<div class="empty">${t('notFound')}</div>`;
    } else if (/^([0-9a-f]{64})$/.test(q)) {
      const tx = await api('/tx/' + q).catch(() => null);
      detail = tx ? `<div class="panel"><h3>${esc(tx.type || 'TX')} · ${t('block')} ${tx.block ?? '—'}</h3>
        <div class="addr-box" style="margin:0"><div class="k">HASH</div><span class="mono">${esc(q)}</span></div>
        <pre style="font-size:11px;white-space:pre-wrap;word-break:break-all;margin-top:10px;color:var(--dim)">${esc(JSON.stringify(tx.params || tx.summary || {}, null, 2))}</pre></div>` : `<div class="empty">${t('notFound')}</div>`;
    } else {
      const ticker = q.replace(/^\$/, '').toUpperCase();
      const tk = await api('/tokens/' + encodeURIComponent(ticker)).catch(() => null);
      detail = tk ? `<div class="empty" style="text-align:left"><a href="#/coin/${esc(tk.id)}" style="color:var(--fg)">$${esc(tk.ticker)}</a> — ${esc(tk.name)} · ${fmtPrice(tk.price)} GRID</div>` : `<div class="empty">${t('notFound')}</div>`;
    }
  }
  viewEl.innerHTML = `
    <div class="sec-title">${t('explorer')}</div>
    <div class="searchbar">
      <input id="ex-q" placeholder="${esc(t('searchPh'))}" value="${esc(query || '')}">
      <button class="btn" id="ex-btn" style="width:auto;padding:10px 18px">${t('search')}</button>
    </div>
    <div id="ex-result" style="margin:14px 0">${detail}</div>
    <div class="sec-title">${t('block')}s</div>
    <div class="feed">${blocks.map((b) => `
      <div class="row ex-block" data-h="${b.height}" style="cursor:pointer">
        <span class="s mono">#${b.height}</span>
        <span class="m mono" style="color:var(--faint)">${b.hash.slice(0, 18)}…</span>
        <span class="m">${b.txs} ${t('txsN')} · ${ago(b.time)}</span>
      </div>`).join('')}</div>`;
  const go = () => { const v = $('#ex-q').value.trim(); location.hash = '#/explorer' + (v ? '/' + encodeURIComponent(v) : ''); };
  $('#ex-btn').onclick = go;
  $('#ex-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  viewEl.querySelectorAll('.ex-block').forEach((r) => {
    r.onclick = () => { location.hash = '#/explorer/' + r.dataset.h; };
  });
}

function blockDetailHtml(b) {
  return `<div class="panel">
    <h3>${t('block')} #${b.height}</h3>
    <div class="addr-box" style="margin-bottom:10px"><div class="k">HASH</div><span class="mono">${esc(b.hash)}</span>
      <div class="k" style="margin-top:8px">STATE ROOT</div><span class="mono">${esc(b.stateRoot)}</span></div>
    <div class="feed">${(b.txs || []).map((tx) => {
      const summary = describeTxLocal(tx);
      return `<div class="row"><span class="s">${esc(summary)}</span><span class="m mono">${esc((tx.from || '').slice(0, 10))}…</span></div>`;
    }).join('') || `<div class="row"><span class="s">—</span></div>`}</div>
  </div>`;
}

function describeTxLocal(tx) {
  const p = tx.params || {};
  switch (tx.type) {
    case 'TRANSFER': return `transfer ${p.amount} GRID → ${String(p.to).slice(0, 12)}…`;
    case 'CREATE_TOKEN': return `created $${String(p.ticker || '').toUpperCase()}`;
    case 'PROFILE': return `name → ${p.name}`;
    case 'COMMENT': return `💬 ${String(p.text || '').slice(0, 50)}`;
    case 'BUY': return `buy ${p.amount} GRID of $${p.token}`;
    case 'SELL': return `sell ${p.amount} $${p.token}`;
    case 'ORDER': return `limit ${p.side} ${p.amount} $${p.token} @ ${p.price}`;
    case 'CANCEL_ORDER': return `cancel order`;
    case 'TOKEN_TRANSFER': return `sent ${p.amount} $${p.token}`;
    case 'MINT': return `minted ${p.amount} GRID`;
    case 'REQUEST_BUY': return `buy request ${p.usdtAmount} ${p.currency}`;
    case 'APPROVE_DEPOSIT': return `${p.reject ? 'rejected' : 'approved'} deposit`;
    default: return tx.type;
  }
}

// ---------------------------------------------------------------- buy GRID
const CURRENCIES = [
  { id: 'USDT_TRC20', label: 'USDT · TRC-20' },
  { id: 'TON', label: 'TON' },
  { id: 'BTC', label: 'BTC' },
];

async function renderBuy() {
  const [cfg, dep] = await Promise.all([api('/config'), api('/deposits')]);
  const rate = Number(cfg.config && cfg.config.usdtRate) || 0;
  const w = loadWallet();
  const my = acct ? dep.deposits.filter((d) => d.address === acct.address) : [];

  viewEl.innerHTML = `
    <div class="narrow">
      <div class="sec-title">${t('buyTitle')}</div>
      <div class="panel">
        ${rate > 0 ? `
        <div class="field"><label>${t('chooseCurrency')}</label>
          <select id="b-cur">${CURRENCIES.map((cc) =>
            `<option value="${cc.id}" ${cfg.config['dep_' + cc.id] ? '' : 'disabled'}>${cc.label}${cfg.config['dep_' + cc.id] ? '' : ' — ' + t('notFound')}</option>`).join('')}</select></div>
        <div class="field"><label>${t('payAmount')}</label><input id="b-amt" type="number" min="1" placeholder="10"></div>
        <div class="field"><label>${t('youGet')}</label><input id="b-get" class="mono" disabled value="0 GRID"></div>
        <button class="btn" id="b-btn">${t('createRequest')}</button>
        <p class="note">${t('sendExactly')}</p>` : `
        <div class="empty">${t('rateNotSet')}</div>`}
      </div>
      <div id="b-result" style="margin-top:14px"></div>
      ${my.length ? `
      <div class="sec-title">${t('myRequests')}</div>
      <div class="feed">${my.map((d) => `
        <div class="row">
          <span class="s">${fmtNum(d.usdt, 2)} ${d.currency} → <b class="mono">${fmtNum(d.grid, 0)} GRID</b>
            <span class="tag st-${d.status}">${t(d.status)}</span></span>
          <span class="m">${ago(d.time)}</span>
        </div>`).join('')}</div>` : ''}
    </div>`;

  if (rate > 0) {
    const upd = () => {
      const usdt = Number($('#b-amt').value) || 0;
      $('#b-get').value = fmtNum(Math.floor(usdt / rate), 0) + ' GRID';
    };
    $('#b-amt').addEventListener('input', upd);
    $('#b-btn').onclick = async () => {
      const w2 = requireWallet();
      if (!w2) return;
      const usdt = Number($('#b-amt').value);
      if (!(usdt >= 1)) return toast(t('enterAmount'));
      const cur = $('#b-cur').value;
      const tx = await sendTx('REQUEST_BUY', { currency: cur, usdtAmount: usdt });
      if (tx) {
        const memo = await txMemo(tx);
        const ccfg = cfg.config;
        $('#b-result').innerHTML = `
          <div class="panel">
            <h3>${t('depositAddress')} · ${cur}</h3>
            <div class="addr-box" style="margin-bottom:10px"><div class="k">${cur}</div>
              <span class="mono">${esc(ccfg['dep_' + cur])}</span></div>
            <div class="addr-box" style="margin-bottom:0"><div class="k">${t('memoLabel')}</div>
              <span class="mono" style="color:var(--up);font-weight:700">${esc(memo)}</span></div>
            <p class="note">${t('sendExactly')}</p>
          </div>`;
      }
    };
  }
}

// memo = first 8 hex chars of the tx hash, computed client-side (SHA-256 of canonical signed tx)
async function txMemo(tx) {
  try {
    const bytes = utf8(canonical({
      type: tx.type, from: tx.from, nonce: tx.nonce, params: tx.params, sig: tx.sig,
    }));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].slice(0, 4)
      .map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  } catch {
    return '—';
  }
}

// ---------------------------------------------------------------- admin panel
async function renderAdmin() {
  const [cfg, accounts, dep] = await Promise.all([api('/config'), api('/accounts'), api('/deposits')]);
  const acct = currentAccount();
  const isAdmin = acct && cfg.admin === acct.address;

  if (!cfg.admin) {
    viewEl.innerHTML = `
      <div class="narrow">
        <div class="sec-title">${t('adminPanel')}</div>
        <div class="panel">
          ${acct ? `<button class="btn" id="a-claim">${t('claimAdmin')}</button>
                 <p class="note">${t('claimAdminNote')}</p>`
             : `<div class="empty">${t('notAdmin')}</div>`}
        </div>
      </div>`;
    const btn = $('#a-claim');
    if (btn) btn.onclick = async () => {
      await sendTx('CLAIM_ADMIN', {});
      renderAdmin();
    };
    return;
  }

  viewEl.innerHTML = `
    <div class="narrow">
      <div class="sec-title">${t('adminPanel')} · ${esc(cfg.adminName || short(cfg.admin))}</div>
      ${!isAdmin ? `<div class="empty">${t('notAdmin')}</div>` : `
      <div class="panel" style="margin-bottom:14px">
        <h3>${t('grantTitle')}</h3>
        <div class="field"><label>${t('grantAmount')}</label><input id="a-amt" type="number" min="1" placeholder="1000"></div>
        <div class="acct-list" style="max-height:220px;overflow-y:auto;border:1px solid var(--line);border-radius:11px;margin-bottom:12px">
          ${accounts.map((a) => `
          <label class="acct-row">
            <input type="checkbox" data-addr="${esc(a.address)}">
            <span class="mono" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.name || a.address)}</span>
            <span class="mono" style="color:var(--dim)">${fmtNum(a.grid, 0)}</span>
          </label>`).join('') || `<div style="padding:14px;color:var(--dim);font-size:12px">${t('noAccounts')}</div>`}
        </div>
        <button class="btn" id="a-mint">${t('grantBtn')} · <span id="a-cnt">0</span> ${t('selected')}</button>
      </div>
      <div class="panel" style="margin-bottom:14px">
        <h3>${t('settingsTitle')}</h3>
        <div class="field"><label>${t('usdtRateLabel')}</label><input id="a-rate" type="number" step="any" min="0" placeholder="0.01" value="${cfg.config.usdtRate || ''}"></div>
        <div class="field"><label>${t('tonRateLabel')}</label><input id="a-ton" type="number" step="any" min="0" placeholder="0.003" value="${cfg.config.tonRate || ''}"></div>
        ${CURRENCIES.map((cc) => `
        <div class="field"><label>${cc.label}</label><input class="dep-addr mono" data-key="dep_${cc.id}" placeholder="${cc.id} address" value="${esc(cfg.config['dep_' + cc.id] || '')}"></div>`).join('')}
        <button class="btn ghost" id="a-save">${t('save')}</button>
      </div>`}
      <div class="sec-title">${t('depositsTitle')}</div>
      <div class="feed">${dep.deposits.map((d) => `
        <div class="row">
          <span class="s">${esc(d.name || short(d.address))} — ${fmtNum(d.usdt, 2)} ${d.currency}
            → <b class="mono">${fmtNum(d.grid, 0)} GRID</b> · <span class="mono">${esc(d.memo)}</span>
            <span class="tag st-${d.status}">${t(d.status)}</span></span>
          ${isAdmin && d.status === 'pending' ? `
          <span style="display:flex;gap:6px">
            <button class="btn dep-ok" data-id="${esc(d.id)}" style="width:auto;padding:5px 10px;font-size:10px">${t('approve')}</button>
            <button class="btn ghost dep-no" data-id="${esc(d.id)}" style="width:auto;padding:5px 10px;font-size:10px">${t('reject')}</button>
          </span>` : ''}
        </div>`).join('') || `<div class="row"><span class="s">${t('noDeposits')}</span></div>`}
      </div>
    </div>`;

  if (isAdmin) {
    const cnt = () => {
      const n = viewEl.querySelectorAll('[data-addr]:checked').length;
      const el = $('#a-cnt');
      if (el) el.textContent = n;
    };
    viewEl.querySelectorAll('[data-addr]').forEach((c) => { c.addEventListener('change', cnt); });
    $('#a-mint').onclick = async () => {
      const amount = Number($('#a-amt').value);
      if (!(amount > 0)) return toast(t('enterAmount'));
      const checked = [...viewEl.querySelectorAll('[data-addr]:checked')].map((c) => c.dataset.addr);
      if (!checked.length) return toast(t('noAccounts'));
      for (const addr of checked) {
        await sendTx('MINT', { to: addr, amount });
      }
      toast(t('confirmed'));
      renderAdmin();
    };
    $('#a-save').onclick = async () => {
      const rate = Number($('#a-rate').value);
      if (rate > 0) await sendTx('SET_CONFIG', { key: 'usdtRate', value: String(rate) });
      const ton = Number($('#a-ton').value);
      if (ton > 0) await sendTx('SET_CONFIG', { key: 'tonRate', value: String(ton) });
      for (const inp of viewEl.querySelectorAll('.dep-addr')) {
        if (inp.value.trim()) await sendTx('SET_CONFIG', { key: inp.dataset.key, value: inp.value.trim() });
      }
      toast(t('confirmed'));
      renderAdmin();
    };
    viewEl.querySelectorAll('.dep-ok').forEach((b) => {
      b.onclick = async () => { await sendTx('APPROVE_DEPOSIT', { id: b.dataset.id }); renderAdmin(); };
    });
    viewEl.querySelectorAll('.dep-no').forEach((b) => {
      b.onclick = async () => { await sendTx('APPROVE_DEPOSIT', { id: b.dataset.id, reject: true }); renderAdmin(); };
    });
  }
}

function applyLang() {
  $('#lang-btn').textContent = LANG.toUpperCase();
  $('#footnote').textContent = t('footer');
  document.querySelectorAll('.tab[data-i18n]').forEach((el) => {
    const label = el.querySelector('span');
    if (label) label.textContent = t(el.dataset.i18n);
  });
  document.documentElement.lang = LANG;
}

// ---------------------------------------------------------------- boot
(async function boot() {
  applyLang();
  // google oauth hands the session token over via the hash: #auth=TOKEN
  if (location.hash.startsWith('#auth=')) {
    const token = location.hash.slice(6);
    localStorage.setItem('gridchain_token', token);
    localStorage.setItem('gridchain_onboarded', '1');
    AUTH.token = token;
    setWalletMode('account');
    location.hash = '#/';
  }
  $('#lang-btn').onclick = () => {
    LANG = LANGS[(LANGS.indexOf(LANG) + 1) % LANGS.length];
    localStorage.setItem('gridchain_lang', LANG);
    applyLang();
    route();
  };
  $('#theme-btn').onclick = () => {
    applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
    route(); // redraw charts with new palette
  };

  const tick = async () => {
    try {
      const s = await api('/stats');
      $('#height-badge').innerHTML = `${t('block')} <b>${s.height}</b> <span class="live-dot"></span>`;
    } catch {}
  };
  updateMuteIcon();
  $('#mute-btn').onclick = () => {
    MUTED = !MUTED;
    localStorage.setItem('gridchain_muted', MUTED ? '1' : '0');
    updateMuteIcon();
    if (!MUTED) beep(880, 0.06);
  };
  // restore an account session (login/password users)
  if (AUTH.token) {
    try {
      AUTH.me = await api('/auth/me', { method: 'POST', headers: { Authorization: 'Bearer ' + AUTH.token } });
    } catch {
      AUTH.token = null;
      localStorage.removeItem('gridchain_token');
    }
  }
  initStream();
  tick();
  setInterval(tick, 15000);
  route();
})();
