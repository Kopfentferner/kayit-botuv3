const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ROL ve KANAL ID'leri
const KAYITLI_ROL = "1253327741063794771";
const KAYITSIZ_ROL = "1253313874342711337";
const KAYIT_KANAL = "1253302712431284306";

// Bot hazır olduğunda
client.once('ready', () => {
    console.log(`Bot aktif: ${client.user.tag}`);
});

// Sunucuya yeni biri katıldığında
client.on('guildMemberAdd', member => {
    const kanal = member.guild.channels.cache.get(KAYIT_KANAL);
    if (kanal) {
        kanal.send(`Hoşgeldin ${member}! Lütfen kayıt olmak için **!kayıt İsim | Steamİsmi #Yaş** komutunu kullan.`);
    }
});

// Mesajları dinleme
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Sadece kayıt kanalında çalışsın
    if (message.channel.id !== KAYIT_KANAL) return;

    if (message.content.startsWith("!kayıt")) {
        const args = message.content.slice("!kayıt".length).trim();

        if (!args) {
            return message.reply("Lütfen doğru formatta yazınız: !kayıt İsim | Steamİsmi #Yaş");
        }

        try {
            const member = message.member;

            // Rol değişimi
            await member.roles.remove(KAYITSIZ_ROL);
            await member.roles.add(KAYITLI_ROL);

            message.reply(`✅ Başarıyla kayıt oldunuz: ${args}`);
        } catch (err) {
            console.error(err);
            message.reply("❌ Kayıt sırasında bir hata oluştu.");
        }
    }
});

// TOKEN render'dan gelecek
client.login(process.env.TOKEN);
