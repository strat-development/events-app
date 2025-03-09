import { CreatedGroupPostTemplate } from "@/email-templates/CreatedGroupPostTemplate";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email, userFullName, groupName } = await request.json();

        if (!Array.isArray(email) || !Array.isArray(userFullName) || email.length !== userFullName.length) {
            return new Response(JSON.stringify({ error: "Invalid email or userFullName data" }), { status: 400 });
        }

        const sendEmailPromises = email.map((emailAddress, index) => {
            return resend.emails.send({
                from: 'huddle@huddle.net.pl',
                to: emailAddress,
                subject: `New ${groupName} Post`,
                react: CreatedGroupPostTemplate({
                    fullName: userFullName[index],
                    group_name: groupName,
                }) as React.ReactElement,
            });
        });

        const results = await Promise.all(sendEmailPromises);

        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
            console.error('Errors sending emails:', errors);
            return new Response(JSON.stringify({ error: "Failed to send some emails" }), { status: 500 });
        }

        return new Response(JSON.stringify({ message: "Email sent successfully" }), { status: 200 });

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}