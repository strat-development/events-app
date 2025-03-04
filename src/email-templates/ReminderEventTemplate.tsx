import * as React from 'react';

interface AttendingEventTemplateProps {
    fullName: string;
    group_name: string;
    date: string;
    eventTitle: string;
    eventAddress: string;
}

export const AttendingEventTemplate: React.FC<Readonly<AttendingEventTemplateProps>> = ({
    fullName,
    group_name,
    date,
    eventTitle,
    eventAddress,
}) => (
    <div style={{ margin: 0, padding: 0, fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', width: '100%', height: '100%' }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ margin: 0, padding: 0 }}>
            <tr>
                <td align="center" style={{ padding: '20px' }}>
                    <table width="600" cellPadding="0" cellSpacing="0" style={{ maxWidth: '100%', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                        <tr>
                            <td align="center" style={{ padding: '24px' }}>
                                <h1 style={{ color: '#333', fontSize: '24px', fontWeight: 'bold' }}>Hi {fullName},</h1>
                                <table width="100%" cellPadding="0" cellSpacing="0">
                                    <tr>
                                        <td align="left" style={{ paddingBottom: '8px' }}>
                                            <h2 style={{ color: '#333', fontSize: '20px', fontWeight: '600', margin: 0 }}>{eventTitle}</h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="left" style={{ paddingBottom: '8px' }}>
                                            <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>{eventAddress}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="left" style={{ paddingBottom: '8px' }}>
                                            <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>{date}</p>
                                        </td>
                                    </tr>
                                </table>
                                <p style={{ color: '#666', fontSize: '16px', margin: '8px 0' }}>This is a reminder that your event with <strong>{group_name}</strong> is happening on {date}.</p>
                                <p style={{ color: '#666', fontSize: '16px', margin: '8px 0' }}>See you there!</p>
                                <a
                                    href="https://huddle.net.pl"
                                    target="_blank"
                                    style={{
                                        padding: '12px 24px',
                                        background: '#007bff',
                                        color: '#fff',
                                        borderRadius: '4px',
                                        fontWeight: '700',
                                        textDecoration: 'none',
                                        display: 'inline-block',
                                        width: 'auto',
                                        minWidth: '150px',
                                        marginTop: '16px',
                                    }}
                                >
                                    View Event Details
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style={{ padding: '24px', color: '#999999', fontSize: '12px' }}>
                                <p>&copy; 2025 Huddle.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
);