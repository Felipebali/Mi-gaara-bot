let handler = async (m, { conn, usedPrefix, command, args }) => {

  // 🔐 Verificar owner
  const isOwner = global.owner
    .map(v => (Array.isArray(v) ? v[0] : v))
    .some(v => String(v).replace(/[^0-9]/g, '') + '@s.whatsapp.net' === m.sender)

  if (!isOwner) return

  let user = global.db.data.users[m.sender]
  if (!user.money) user.money = 1000

  const menu = `
╔═══🎰 *CASINO OWNER* 🎰═══╗
║
║ 🎲 ${usedPrefix}slot
║ 🎰 ${usedPrefix}ruleta
║ 🃏 ${usedPrefix}blackjack
║ 💎 ${usedPrefix}apostar
║ 💰 ${usedPrefix}balance
║ 🎯 ${usedPrefix}doble
║ 🪙 ${usedPrefix}coinflip
║ 🎲 ${usedPrefix}dados
║ 🎁 ${usedPrefix}premio
║ 🏆 ${usedPrefix}jackpot
║
╚════════════════════╝

👑 Exclusivo propietarios
💰 Dinero: ${user.money}
`

  // 🎰 MENU
  if (command === 'menucasino' || command === 'casino') {
    return conn.reply(m.chat, menu, m)
  }

  // 💰 BALANCE
  if (command === 'balance') {
    return conn.reply(m.chat, `💰 Tienes: ${user.money}`, m)
  }

  // 🎲 SLOT
  if (command === 'slot') {
    let emojis = ['🍒','🍇','🍉','⭐','💎']
    let a = emojis[Math.floor(Math.random()*emojis.length)]
    let b = emojis[Math.floor(Math.random()*emojis.length)]
    let c = emojis[Math.floor(Math.random()*emojis.length)]

    let win = (a === b && b === c)

    if (win) {
      user.money += 500
      return conn.reply(m.chat, `🎰 ${a} | ${b} | ${c}\n\n💎 GANASTE 500`, m)
    } else {
      user.money -= 100
      return conn.reply(m.chat, `🎰 ${a} | ${b} | ${c}\n\n❌ Perdiste 100`, m)
    }
  }

  // 🎰 RULETA
  if (command === 'ruleta') {
    let win = Math.random() < 0.5
    if (win) {
      user.money += 300
      return conn.reply(m.chat, `🎰 La ruleta giró...\n💚 GANASTE 300`, m)
    } else {
      user.money -= 150
      return conn.reply(m.chat, `🎰 La ruleta giró...\n💔 Perdiste 150`, m)
    }
  }

  // 🃏 BLACKJACK SIMPLE
  if (command === 'blackjack') {
    let player = Math.floor(Math.random()*21)+1
    let dealer = Math.floor(Math.random()*21)+1

    if (player > dealer) {
      user.money += 400
      return conn.reply(m.chat, `🃏 Tú: ${player}\n🤖 Dealer: ${dealer}\n\nGANASTE 400`, m)
    } else {
      user.money -= 200
      return conn.reply(m.chat, `🃏 Tú: ${player}\n🤖 Dealer: ${dealer}\n\nPerdiste 200`, m)
    }
  }

  // 💎 APOSTAR
  if (command === 'apostar') {
    let bet = parseInt(args[0])
    if (!bet) return m.reply('💰 Ejemplo: .apostar 100')
    if (bet > user.money) return m.reply('❌ No tienes dinero')

    let win = Math.random() < 0.5

    if (win) {
      user.money += bet
      return conn.reply(m.chat, `🎉 Ganaste ${bet}`, m)
    } else {
      user.money -= bet
      return conn.reply(m.chat, `💀 Perdiste ${bet}`, m)
    }
  }

  // 🎯 DOBLE
  if (command === 'doble') {
    if (user.money <= 0) return m.reply('No tienes dinero')
    let win = Math.random() < 0.5

    if (win) {
      user.money *= 2
      return conn.reply(m.chat, `🔥 DINERO DOBLADO\n💰 ${user.money}`, m)
    } else {
      user.money = 0
      return conn.reply(m.chat, `💀 Perdiste todo`, m)
    }
  }

  // 🪙 COINFLIP
  if (command === 'coinflip') {
    let result = Math.random() < 0.5 ? 'Cara' : 'Cruz'
    return conn.reply(m.chat, `🪙 Salió: ${result}`, m)
  }

  // 🎲 DADOS
  if (command === 'dados') {
    let dice = Math.floor(Math.random()*6)+1
    user.money += dice * 10
    return conn.reply(m.chat, `🎲 Sacaste ${dice}\n💰 Ganaste ${dice*10}`, m)
  }

  // 🎁 PREMIO
  if (command === 'premio') {
    let reward = Math.floor(Math.random()*500)+100
    user.money += reward
    return conn.reply(m.chat, `🎁 Premio: ${reward}`, m)
  }

  // 🏆 JACKPOT
  if (command === 'jackpot') {
    let win = Math.random() < 0.2
    if (win) {
      user.money += 2000
      return conn.reply(m.chat, `🏆 JACKPOT!!!\n💰 +2000`, m)
    } else {
      user.money -= 300
      return conn.reply(m.chat, `💀 No hubo jackpot\n-300`, m)
    }
  }

}

handler.help = [
  'menucasino','casino','slot','ruleta','blackjack',
  'apostar','balance','doble','coinflip','dados',
  'premio','jackpot'
]

handler.tags = ['owner']
handler.command = /^(menucasino|casino|slot|ruleta|blackjack|apostar|balance|doble|coinflip|dados|premio|jackpot)$/i

export default handler
