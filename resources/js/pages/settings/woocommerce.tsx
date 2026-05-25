import { Form, Head, usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit, update } from '@/routes/settings/woocommerce';
import WooCommerceController from '@/actions/App/Http/Controllers/Settings/WooCommerceController';

export default function WooCommerce({ settings }: { settings?: { consumer?: string; secret?: string } }) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="WooCommerce settings" />

            <h1 className="sr-only">WooCommerce settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="WooCommerce API settings"
                    description="Store your WooCommerce REST API consumer key and secret"
                />

                <Form
                    {...WooCommerceController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="consumer">Consumer key</Label>

                                <Input
                                    id="consumer"
                                    className="mt-1 block w-full"
                                    defaultValue={settings?.consumer ?? 'ck_db94bb3929b4c254b8598f29adf42f142151e0d2'}
                                    name="consumer"
                                    placeholder="Consumer key"
                                />

                                <InputError className="mt-2" message={errors.consumer} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="secret">Secret</Label>

                                <Input
                                    id="secret"
                                    className="mt-1 block w-full"
                                    defaultValue={settings?.secret ?? 'cs_4349e4988c75310a909006c5cc5e1e375ab9e9a7'}
                                    name="secret"
                                    placeholder="Secret"
                                />

                                <InputError className="mt-2" message={errors.secret} />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing} data-test="update-woocommerce-button">
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

WooCommerce.layout = {
    breadcrumbs: [
        {
            title: 'WooCommerce settings',
            href: edit(),
        },
    ],
};
