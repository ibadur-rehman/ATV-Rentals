// templates.ts
// Fixed (non-dynamic) text templates for SMS messages.
// Organized by location (htown / dtown) and language (en / es)

export const templates = {
  htown: {
    en: {
      location: `Our address is 807 Highway 90 Crosby, TX 77532.
This will take you to Bonsai Lex nursery and a local farmers market fruit stand. Look for the sign that says 'Shuttle Pick Up Location' — wait there for the shuttle.`,
      pricing: `Hey this is Maria from H-Town ATV Rentals. We just got off the phone.  Below is our information. 

Reservation Link - http://htownatvrentals.org/

ATV Prices:
- 45 min: $110 (Mon–Thu)
- 1 hr: $130 (Mon–Sun)
- 2 hr Single: $160 / Double: $180 (Mon–Sun)

Buggy Prices:
- 1 hr – 2 seat: $225 / 4 seat: $300
- 2 hr – 2 seat: $350 / 4 seat: $450

Save $20 each on 6+ rentals. Helmets & goggles included.

Deposit: $50 per vehicle to reserve (non-refundable if canceled/missed). Balance due at check-in.

Requirements: 16+ to drive, 5+ to ride with an adult.

Security Hold: $100 per ATV or $500 per buggy held at check-in, refunded after tour if no damage.
`,

      deposit: `For all deposit updates/receipts, please email support@takeoversrentals.com with the following information. 

- Name of reservation 
- The last 4 digits of the card used 
- Day and time of ride 

Please note that, depending on your bank, deposit transactions can take 2-7 business days to be removed from your account. Our support team will email you proof of all receipts we have on file, including the voided deposit receipt, for your record.
`,

      groupon: `Thank you for your Groupon purchase to schedule your tour time with H-Town ATV Rentals. Please send the following!

- Picture of the Groupon voucher with code
- name
- Date and time for the ride
- Email

Once we receive this information we'll confirm your time. Thank you!
`,
      available: `Hey, this is Maria from H-Town ATV Rentals. You can check our availability and tour options at this link: https://www.takeoversrentals.com/book-online

Here are the steps to book online:
1. Click the option you want to book.
2. On the calendar page, select the Day you want to ride.
3. Choose your preferred time.
4. Complete the reservation on the next page.`,

      transfer: `Hey, this is the booking team from H-Town ATV Rentals. 
This is our direct line — you can call or text us here for anything you may need. What's your name so we can save your contact and better assist you with your inquiry.
`
    },

    es: {
      location: `Nuestra dirección es 807 Highway 90 Crosby, TX 77532.
Al llegar a esa dirección verás el vivero Bonsai Lex y un puesto de frutas del mercado local. Hay un letrero que dice 'Shuttle Pick Up Location'. Espera allí el shuttle que te llevará al lugar de los ATVs.`,
      pricing: `Hola, soy Maria de H-Town ATV Rentals. Acabamos de hablar por teléfono. A continuación te dejo toda la información:

Enlace de reservación: https://www.takeoversrentals.com/

Precios de ATV:
45 min – $110 (Lun–Jue)
1 hora – $130 (Lun–Dom)
2 horas – Individual $160 / Doble $180 (Lun–Dom)

Precios de Buggys:
1 hora – 2 asientos $225 / 4 asientos $300
2 horas – 2 asientos $350 / 4 asientos $450

Ahorra $20 por vehículo al reservar 6 o más.Casco y gafas incluidos.

Depósito de reservación: $50 por vehículo para asegurar tu lugar (no reembolsable si cancelas o no llegas). El saldo restante se paga al hacer el check-in.

Requisitos: 16+ años para conducir, 5+ años para ir de pasajero con un adulto.

Depósito de seguridad: $100 por ATV o $500 por Buggy retenidos al registrarte y reembolsados después del tour si no hay daños.
`,

      deposit: `Para todas las actualizaciones o recibos de depósito, por favor envía un correo electrónico a support@takeoversrentals.com con la siguiente información:

Nombre de la reservación
Los últimos 4 dígitos de la tarjeta utilizada
Día y hora del paseo

Ten en cuenta que, dependiendo de tu banco, las transacciones del depósito pueden tardar entre 2 y 7 días hábiles en desaparecer de tu cuenta. Nuestro equipo de soporte te enviará por correo electrónico todas las pruebas y recibos que tengamos en archivo, incluyendo el recibo del depósito anulado, para tus registros.
`,

      groupon: `Gracias por tu compra en Groupon para programar tu tour con H-Town ATV Rentals.Por favor envía lo siguiente:


- Foto del cupón de Groupon con el código visible
- Nombre completo
- Fecha y hora del paseo
- Correo electrónico
`,
      transfer: `Hola, somos el equipo de reservas de H-Town ATV Rentals.Esta es nuestra línea directa — puedes llamarnos o enviarnos un mensaje de texto aquí para lo que necesites.¿Cuál es tu nombre para guardar tu contacto y poder ayudarte mejor con tu consulta.
`,
      available: `Hola, soy María de H-Town ATV Rentals. Puedes revisar nuestra disponibilidad y opciones de tour en este enlace: https://www.takeoversrentals.com/book-online

Aquí están los pasos para reservar en línea:
Haz clic en la opción que deseas reservar.
En la página del calendario, selecciona el día en el que quieres montar.
Elige tu horario preferido.
Completa la reservación en la siguiente página.`
    }
  },

  dtown: {
    en: {
      location: `Our address is 5455 Everman Kennedale Rd, Fort Worth, TX 76140.
This will take you to Bonsai Lex nursery and a local farmers market fruit stand. Look for the sign that says 'Shuttle Pick Up Location' — wait there for the shuttle.`,
      pricing: `Hey this is Maria from D-Town ATV Rentals. We just got off the phone.  Below is our information. 

Reservation Link - http://htownatvrentals.org/

ATV Prices:
- 45 min: $110 (Mon–Thu)
- 1 hr: $130 (Mon–Sun)
- 2 hr Single: $160 / Double: $180 (Mon–Sun)

Buggy Prices:
- 1 hr – 2 seat: $225 / 4 seat: $300
- 2 hr – 2 seat: $350 / 4 seat: $450

Save $20 each on 6+ rentals. Helmets & goggles included.

Deposit: $50 per vehicle to reserve (non-refundable if canceled/missed). Balance due at check-in.

Requirements: 16+ to drive, 5+ to ride with an adult.

Security Hold: $100 per ATV or $500 per buggy held at check-in, refunded after tour if no damage.
`,

      deposit: `For all deposit updates/receipts, please email support@takeoversrentals.com with the following information. 

- Name of reservation 
- The last 4 digits of the card used 
- Day and time of ride 

Please note that, depending on your bank, deposit transactions can take 2-7 business days to be removed from your account. Our support team will email you proof of all receipts we have on file, including the voided deposit receipt, for your record.
`,

      groupon: `Thank you for your Groupon purchase to schedule your tour time with D-Town ATV Rentals. Please send the following!

- Picture of the Groupon voucher with code
- name
- Date and time for the ride
- Email

Once we receive this information we'll confirm your time. Thank you!
`,
      available: `Hey, this is Maria from D-Town ATV Rentals. You can check our availability and tour options at this link: https://www.takeoversrentals.com/book-online

Here are the steps to book online:
1. Click the option you want to book.
2. On the calendar page, select the Day you want to ride.
3. Choose your preferred time.
4. Complete the reservation on the next page.`,

      transfer: `Hey, this is the booking team from D-Town ATV Rentals. 
This is our direct line — you can call or text us here for anything you may need. What's your name so we can save your contact and better assist you with your inquiry.
`
    },

    es: {
      location: `Nuestra dirección es 5455 Everman Kennedale Rd, Fort Worth, TX 76140.
Al llegar a esa dirección verás el vivero Bonsai Lex y un puesto de frutas del mercado local. Hay un letrero que dice 'Shuttle Pick Up Location'. Espera allí el shuttle que te llevará al lugar de los ATVs.`,
      pricing: `Hola, soy Maria de D-Town ATV Rentals. Acabamos de hablar por teléfono. A continuación te dejo toda la información:

Enlace de reservación: https://www.takeoversrentals.com/

Precios de ATV:
45 min – $110 (Lun–Jue)
1 hora – $130 (Lun–Dom)
2 horas – Individual $160 / Doble $180 (Lun–Dom)

Precios de Buggys:
1 hora – 2 asientos $225 / 4 asientos $300
2 horas – 2 asientos $350 / 4 asientos $450

Ahorra $20 por vehículo al reservar 6 o más.Casco y gafas incluidos.

Depósito de reservación: $50 por vehículo para asegurar tu lugar (no reembolsable si cancelas o no llegas). El saldo restante se paga al hacer el check-in.

Requisitos: 16+ años para conducir, 5+ años para ir de pasajero con un adulto.

Depósito de seguridad: $100 por ATV o $500 por Buggy retenidos al registrarte y reembolsados después del tour si no hay daños.
`,

      deposit: `Para todas las actualizaciones o recibos de depósito, por favor envía un correo electrónico a support@takeoversrentals.com con la siguiente información:

Nombre de la reservación
Los últimos 4 dígitos de la tarjeta utilizada
Día y hora del paseo

Ten en cuenta que, dependiendo de tu banco, las transacciones del depósito pueden tardar entre 2 y 7 días hábiles en desaparecer de tu cuenta. Nuestro equipo de soporte te enviará por correo electrónico todas las pruebas y recibos que tengamos en archivo, incluyendo el recibo del depósito anulado, para tus registros.
`,

      groupon: `Gracias por tu compra en Groupon para programar tu tour con D-Town ATV Rentals.Por favor envía lo siguiente:


- Foto del cupón de Groupon con el código visible
- Nombre completo
- Fecha y hora del paseo
- Correo electrónico
`,
      transfer: `Hola, somos el equipo de reservas de D-Town ATV Rentals.Esta es nuestra línea directa — puedes llamarnos o enviarnos un mensaje de texto aquí para lo que necesites.¿Cuál es tu nombre para guardar tu contacto y poder ayudarte mejor con tu consulta.
`,
      available: `Hola, soy María de D-Town ATV Rentals. Puedes revisar nuestra disponibilidad y opciones de tour en este enlace: https://www.takeoversrentals.com/book-online

Aquí están los pasos para reservar en línea:
Haz clic en la opción que deseas reservar.
En la página del calendario, selecciona el día en el que quieres montar.
Elige tu horario preferido.
Completa la reservación en la siguiente página.`
    }
  }
};
