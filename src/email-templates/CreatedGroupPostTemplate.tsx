import * as React from 'react';

interface GroupPostEmailTemplateProps {
    fullName: string;
    group_name: string;
    post_title?: string;
    post_author?: string;
}

export const CreatedGroupPostTemplate: React.FC<Readonly<GroupPostEmailTemplateProps>> = ({
    fullName,
    group_name,
    post_title,
    post_author,
}) => (
    <div style={{ margin: 0, padding: 0, fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', width: '100%', height: '100%' }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ margin: 0, padding: 0 }}>
            <tr>
                <td align="center" style={{ padding: '20px' }}>
                    <table width="600" cellPadding="0" cellSpacing="0" style={{ maxWidth: '100%', background: 'linear-gradient(135deg, #050505, #070707)', borderRadius: '16px', boxShadow: '0 24px 16px rgba(0, 0, 0, 0.7)' }}>
                        <tr>
                            <td align="center" style={{ padding: '24px' }}>
                                <h1 style={{ color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '.2rem', fontSize: '24px' }}>
                                    Hello, <span style={{ color: '#fff', fontWeight: 'bold' }}>{fullName}</span>!
                                </h1>
                                <p style={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '.1rem', margin: '8px 0', fontSize: '16px' }}>
                                    A new post has been created in the group <span style={{ fontSize: '20px', color: '#fff', fontWeight: '600' }}>{group_name}</span>.
                                </p>
                                {post_title && (
                                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '.1rem', margin: '8px 0', fontSize: '16px' }}>
                                        Post Title: <span style={{ color: '#fff', fontWeight: '600' }}>{post_title}</span>
                                    </p>
                                )}
                                {post_author && (
                                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '.1rem', margin: '8px 0', fontSize: '16px' }}>
                                        Posted by: <span style={{ color: '#fff', fontWeight: '600' }}>{post_author}</span>
                                    </p>
                                )}
                                <br />
                                <br />
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
                                    View Post
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