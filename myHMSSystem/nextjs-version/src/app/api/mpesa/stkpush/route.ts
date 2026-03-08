import { NextResponse } from "next/server"

export async function POST(req: Request) {

  const { phone, amount } = await req.json()

  const response = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MPESA_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: process.env.MPESA_PASSWORD,
      Timestamp: process.env.MPESA_TIMESTAMP,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK,
      AccountReference: "Hospital Payment",
      TransactionDesc: "Hospital Bill"
    })
  })

  const data = await response.json()

  return NextResponse.json(data)
}