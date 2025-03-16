import { AttendingEventTemplate } from "@/email-templates/AttendingEventTemplate";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email, userFullName, groupName, visitDate, eventTitle, eventAddress } = await request.json();

        if (typeof email !== "string" || typeof userFullName !== "string") {
            return new Response(JSON.stringify({ error: "Invalid email or userFullName data" }), { status: 400 });
        }

        const result = await resend.emails.send({
            from: 'huddle@huddle.net.pl',
            to: email,
            subject: `${groupName} Event Attending`,
            react: AttendingEventTemplate({
                fullName: userFullName,
                group_name: groupName,
                date: visitDate[0],
                eventTitle: eventTitle,
                eventAddress: eventAddress,
            }) as React.ReactElement,
        });

        if (result.error) {
            console.error('Error sending email:', result.error);
            return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
        }

        return new Response(JSON.stringify({ message: "Email sent successfully" }), { status: 200 });

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}