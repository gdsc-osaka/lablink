import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from './src/firebase/admin';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        // トークンが無ければログインページにリダイレクト
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        await authAdmin.verifyIdToken(token);
        // 検証成功ならそのまま実行
        return NextResponse.next();
    } catch (error) {
        // 検証エラーなら無効なクッキーを消去してログインページにリダイレクト
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|login).*)',
    ],
};
