import { Alert, Button, Form, Input, Modal } from "antd";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { NIFFLER_ENABLED } from "@/constant/niffler";
import { useConfigStore } from "@/stores/use-config-store";
import { useNifflerStore } from "@/stores/use-niffler-store";
import { useUserStore } from "@/stores/use-user-store";

export function NifflerGate({ children }: { children: ReactNode }) {
    const session = useNifflerStore((state) => state.session);
    const runtime = useNifflerStore((state) => state.runtime);
    const bootstrap = useNifflerStore((state) => state.bootstrap);
    const applyNifflerModels = useConfigStore((state) => state.applyNifflerModels);
    const setUser = useUserStore((state) => state.setUser);
    const clearSession = useUserStore((state) => state.clearSession);

    useEffect(() => {
        if (!NIFFLER_ENABLED) return;
        void bootstrap();
    }, [bootstrap]);

    useEffect(() => {
        if (!session || !runtime) {
            clearSession();
            return;
        }
        applyNifflerModels(runtime);
        setUser({
            id: session.profile.id,
            username: session.profile.username,
            displayName: session.profile.username,
            avatarUrl: session.profile.preferences?.avatar_url || "",
        });
    }, [applyNifflerModels, clearSession, runtime, session, setUser]);

    return (
        <>
            {children}
            {NIFFLER_ENABLED ? <NifflerLoginModal /> : null}
        </>
    );
}

function NifflerLoginModal() {
    const status = useNifflerStore((state) => state.status);
    const error = useNifflerStore((state) => state.error);
    const loginOpen = useNifflerStore((state) => state.loginOpen);
    const login = useNifflerStore((state) => state.login);
    const setLoginOpen = useNifflerStore((state) => state.setLoginOpen);

    return (
        <Modal title="登录 Niffler" open={loginOpen} footer={null} centered destroyOnHidden onCancel={() => setLoginOpen(false)}>
            <p className="mb-5 text-sm leading-6 text-stone-500">登录后可以直接使用账号中的 API Key 和可用模型；也可以关闭弹窗，在配置中使用自己的 Base URL 和 API Key。</p>
            {error ? <Alert className="mb-4" type="error" showIcon title={error} /> : null}
            <Form layout="vertical" requiredMark={false} onFinish={(values: { username: string; password: string }) => void login(values.username.trim(), values.password)}>
                <Form.Item label="用户名或邮箱" name="username" rules={[{ required: true, message: "请输入用户名或邮箱" }]}>
                    <Input size="large" autoComplete="username" placeholder="输入用户名或邮箱" />
                </Form.Item>
                <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
                    <Input.Password size="large" autoComplete="current-password" placeholder="输入密码" />
                </Form.Item>
                <Button type="primary" htmlType="submit" size="large" block loading={status === "loading"}>
                    登录
                </Button>
            </Form>
        </Modal>
    );
}
