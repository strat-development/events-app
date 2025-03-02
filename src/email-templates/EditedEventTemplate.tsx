import * as React from 'react';

interface EditedEventTemplateProps {
    fullName: string;
    group_name: string;
    date: string;
}

export const EditedEventTemplate: React.FC<Readonly<EditedEventTemplateProps>> = ({
    fullName,
    group_name,
    date,
}) => (
    <div style={{ margin: 0, padding: 0, fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', width: '100%', height: '100%' }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ margin: 0, padding: 0 }}>
            <tr>
                <td align="center" style={{ padding: '20px' }}>
                    <table width="600" cellPadding="0" cellSpacing="0" style={{ maxWidth: '100%', background: 'linear-gradient(135deg, #050505, #070707)', borderRadius: '16px', boxShadow: '0 24px 16px rgba(0, 0, 0, 0.7)' }}>
                        <tr>
                            <td align="center" style={{ padding: '24px' }}>
                                <h1 style={{ color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '.2rem', fontSize: '24px' }}>Hello, <span style={{ color: '#fff', fontWeight: 'bold' }}>{fullName}</span>!</h1>
                                <p style={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '.1rem', margin: '8px 0', fontSize: '16px' }}>Your event at <span style={{ fontSize: '20px', color: '#fff', fontWeight: '600' }}>{group_name}</span> has been edited.</p>
                                <br />
                                <br />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '16px' }}>
                                        <span style={{ color: '#fff' }}>New event date:</span> {date}
                                    </p>
                                </div>
                                <a
                                    href="https://huddle.net.pl"
                                    target="_blank"
                                    style={{
                                        padding: '16px',
                                        background: '#fff',
                                        color: 'rgba(0, 0, 0, 0.8)',
                                        borderRadius: '8px',
                                        fontWeight: '700',
                                        textDecoration: 'none',
                                        display: 'inline-block',
                                        width: 'auto',
                                        minWidth: '150px',
                                        marginTop: '16px',
                                    }}
                                >
                                    Go to website
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