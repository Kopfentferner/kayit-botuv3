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

client.once('ready', () => {
    console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('guildMemberAdd', member => {
    const kanal = member.guild.channels.cache.get(KAYIT_KANAL);
    if (kanal) {
        kanal.send(`Hoşgeldin ${member}! Lütfen kayıt olmak için **!kayıt İsim Nickname Yaş** komutunu kullan.`);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.channel.id !== KAYIT_KANAL) return;

    if (message.content.startsWith("!kayıt")) {
        const args = message.content.slice("!kayıt".length).trim().split(" ");

        if (args.length < 3) {
            return message.reply("Lütfen doğru formatta yazınız: !kayıt İsim Nickname Yaş");
        }

        const isim = args[0];
        const nickname = args[1];
        const yas = args[2];

        // Otomatik formatlama
        const yeniTakmaAd = `${isim} | ${nickname} #${yas}`;

        try {
            const member = message.member;

            // Takma adı değiştirme
            await member.setNickname(yeniTakmaAd);

            // Rol değişimi
            await member.roles.remove(KAYITSIZ_ROL);
            await member.roles.add(KAYITLI_ROL);

            message.reply(`✅ Başarıyla kayıt oldunuz! Yeni adınız: **${yeniTakmaAd}**`);
        } catch (err) {
            console.error(err);
            message.reply("❌ Kayıt sırasında bir hata oluştu. Botun rolü en üstte olmalı ki isim değiştirebilsin.");
        }
    }
});

client.login(process.env.TOKEN);
