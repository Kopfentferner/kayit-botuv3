const { 
  Client, GatewayIntentBits, Partials,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, ChannelType, PermissionsBitField
} = require("discord.js");
const fs = require("fs");
const express = require("express"); // Express eklendi
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// === Kayıt Sistemi ID'leri ===
const KAYITLI_ROL = "1253327741063794771";
const KAYITSIZ_ROL = "1253313874342711337";
const KAYIT_KANAL = "1253302712431284306";

// === Başvuru Sistemi ID'leri ===
const BASVURU_KANAL = "1253349074615275600";
const BASVURULAR_KATEGORI = "1253348803487076454";
const LOG_KANAL = "1466030876709359680";
const YETKILI_IDS = [
  "1253285883826929810", // Sunucu Sahibi
  "1465050726576427263", // Yönetim
  "1465056480871845949"  // Üst Yetkili
];

let basvuruSayac = 1;

client.once("ready", () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

// === Kayıt Sistemi ===
client.on("guildMemberAdd", member => {
  const kanal = member.guild.channels.cache.get(KAYIT_KANAL);
  if (kanal) {
    kanal.send(`Hoşgeldin ${member}! Lütfen kayıt olmak için **!kayıt İsim Nickname Yaş** komutunu kullan.`);
  }
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  // Kayıt komutu
  if (message.channel.id === KAYIT_KANAL && message.content.startsWith("!kayıt")) {
    const args = message.content.slice("!kayıt".length).trim().split(" ");
    if (args.length < 3) {
      return message.reply("Lütfen doğru formatta yazınız: !kayıt İsim Nickname Yaş");
    }

    const isim = args[0];
    const nickname = args[1];
    const yas = args[2];
    const yeniTakmaAd = `${isim} | ${nickname} #${yas}`;

    try {
      const member = message.member;
      await member.setNickname(yeniTakmaAd);
      await member.roles.remove(KAYITSIZ_ROL);
      await member.roles.add(KAYITLI_ROL);

      message.reply(`✅ Başarıyla kayıt oldunuz! Yeni adınız: **${yeniTakmaAd}**`);
    } catch (err) {
      console.error(err);
      message.reply("❌ Kayıt sırasında bir hata oluştu. Botun rolü en üstte olmalı ki isim değiştirebilsin.");
    }
  }

  // Başvuru paneli komutu
  if (message.channel.id === BASVURU_KANAL && message.content === "!panel") {
    const embed = new EmbedBuilder()
      .setTitle("Başvuru Paneli")
      .setDescription("🛡️ Admin Başvuru → Ücretli ve Ücretsiz Yetki için.\n💎 VIP Başvuru → Ücretli VIP için.")
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("adminBasvuru")
        .setLabel("🛡️ Admin Başvuru")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("vipBasvuru")
        .setLabel("💎 VIP Başvuru")
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// === Başvuru Sistemi ===
client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === "adminBasvuru" || interaction.customId === "vipBasvuru") {
      const modal = new ModalBuilder()
        .setCustomId("basvuruForm")
        .setTitle(interaction.customId === "adminBasvuru" ? "Admin Başvuru Formu" : "VIP Başvuru Formu");

      const isim = new TextInputBuilder().setCustomId("isim").setLabel("İsim Soyisim").setStyle(TextInputStyle.Short).setRequired(true);
      const yas = new TextInputBuilder().setCustomId("yas").setLabel("Yaş").setStyle(TextInputStyle.Short).setRequired(true);
      const sure = new TextInputBuilder().setCustomId("sure").setLabel("Sunucuda geçirdiğiniz süre (!surem)").setStyle(TextInputStyle.Short).setRequired(true);
      const steam = new TextInputBuilder().setCustomId("steam").setLabel("Steam Profil Linki").setStyle(TextInputStyle.Short).setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(isim),
        new ActionRowBuilder().addComponents(yas),
        new ActionRowBuilder().addComponents(sure),
        new ActionRowBuilder().addComponents(steam)
      );

      await interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === "basvuruForm") {
    const isim = interaction.fields.getTextInputValue("isim");
    const yas = interaction.fields.getTextInputValue("yas");
    const sure = interaction.fields.getTextInputValue("sure");
    const steam = interaction.fields.getTextInputValue("steam");

    const guild = interaction.guild;
    const kanalAdi = `başvuru-${basvuruSayac++}`;

    const basvuruKanal = await guild.channels.create({
      name: kanalAdi,
      type: ChannelType.GuildText,
      parent: BASVURULAR_KATEGORI,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
        ...YETKILI_IDS.map(id => ({ id, allow: [PermissionsBitField.Flags.ViewChannel] }))
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("Yeni Başvuru")
      .setColor("Green")
      .addFields(
        { name: "İsim Soyisim", value: isim },
        { name: "Yaş", value: yas },
        { name: "Sunucuda Süre", value: sure },
        { name: "Steam", value: steam }
      )
      .setFooter({ text: `Başvuru sahibi: ${interaction.user.tag}` });

    const kapatRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticketKapat").setLabel("Ticket Kapat").setStyle(ButtonStyle.Danger)
    );

    await basvuruKanal.send({ embeds: [embed], components: [kapatRow] });
    await interaction.reply({ content: `Başvurunuz oluşturuldu: ${basvuruKanal}`, ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === "ticketKapat") {
    if (!YETKILI_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: "Bu işlemi sadece yetkililer yapabilir.", ephemeral: true });
    }

    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 100 });
    let logText = "";
    messages.forEach(msg => {
      logText += `[${msg.author.tag}]: ${msg.content}\n`;
    });

    const fileName = `${channel.name}.txt`;
    fs.writeFileSync(fileName, logText);

    const logChannel = channel.guild.channels.cache.get(LOG_KANAL);
    await logChannel.send({ content: `Ticket kapatıldı: ${channel.name}`, files: [fileName] });

    await interaction.reply({ content: "Ticket kapatılıyor...", ephemeral: true });
    setTimeout(() => channel.delete(), 2000);
  }
});

// === Express Server (Uptime Robot için) ===
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot çalışıyor!");
});

app.listen(PORT, () => {
  console.log(`Web server ${PORT} portunda çalışıyor`);
});

client.login(process.env.TOKEN);
