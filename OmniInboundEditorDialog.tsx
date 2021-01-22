import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Dialog, DialogContent, DialogActions, DialogTitle } from '@rmwc/dialog';
import { Button } from '@rmwc/button';
import AdvancedSelect from '../../../../common/AdvancedSelect';
import axios from 'axios';
import { MODE } from '.';
import CONSTANTS from '../../../../agent/constants';

interface InboundRoute {
    routeId: number;
    email: string;
    campaignId: number;
    queueId: number;
}

interface OmniInboundRouteEditorDialogProps {
    translate: (key: string) => string;
    onClose?: () => any;
    rowProps?: InboundRoute;
    mode: string;
}

export const OmniInboundRouteEditorDialog = (props: OmniInboundRouteEditorDialogProps) => {
    const { translate, onClose, rowProps, mode } = props;
    const { campaignId = null, queueId = null, routeId = null, email: emailAddress = '' } = rowProps || {};
    const [open, setOpen] = useState(true);
    const [campaigns, setCampaigns] = useState([]);
    const [queues, setQueues] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId || null);
    const [selectedQueueId, setSelectedQueueId] = useState(queueId || null);
    const [email, setEmail] = useState(emailAddress);
    const [errors, setErrors] = useState({ email: '' });

    const fetchCampaigns = async () => {
        const result: any = await axios('?page=ajax_controller&module=CampaignAdmin&cmd=listSlim&type=inbound');
        setCampaigns(result.data);
    };

    const fetchQueues = async () => {
        const result = await axios('?page=ajax_controller&module=OmniQueues&cmd=listAll');
        setQueues(result.data);
    };

    useEffect(() => {
        fetchCampaigns();
        fetchQueues();
    }, []);

    const closeDialog = () => {
        setOpen(false);
        if (onClose) {
            onClose();
        }
    };

    const getValue = (options, value) => {
        const match = options.find(option => value === option.id);
        if (match) {
            return { value: match.id, label: match.name };
        }
    };

    const saveInboundRoute = async () => {
        if (mode === MODE.EDIT) {
            await axios
                .post('?page=ajax_controller&module=InboundRouteOmni&cmd=assignQueue', {
                    id: routeId,
                    queue: {
                        id: selectedQueueId,
                        campaign_id: selectedCampaignId,
                    },
                })
                .then(() => closeDialog())
                .catch(err => {
                    window.ShowError((err.response && err.response.data.description) || err.message);
                });
        } else {
            await axios
                .post('?page=ajax_controller&module=InboundRouteOmni&cmd=createEmail', {
                    email,
                    destination: {
                        type: 'queue',
                        id: selectedQueueId,
                        campaign_id: selectedCampaignId,
                    },
                })
                .then(() => closeDialog())
                .catch(err => {
                    if (err.response && err.response.data.error === 'duplicate_email') {
                        setErrors({ email: translate('admin.inbound.inbound_routes.editor_dialog.duplicate_email.error') });
                    } else {
                        window.ShowError((err.response && err.response.data.description) || err.message);
                    }
                });
        }
    };

    const handleEmailValidation = () => {
        if (email) {
            if (!CONSTANTS.EMAIL_REGEX.test(email)) {
                setErrors({ email: translate('admin.inbound.inbound_routes.editor_dialog.email_format.error') });
            } else {
                setErrors({ email: '' });
            }
        }
    };
    return (
        <>
            <Dialog open={open} preventOutsideDismiss className="omni-inbound-route-editor-dialog" onClose={closeDialog}>
                <DialogTitle className="title-text">{translate('admin.inbound.inbound_routes.editor_dialog.title')}</DialogTitle>
                <DialogContent>
                    <div className="settings-item">
                        <AdvancedSelect
                            label={translate('admin.inbound.inbound_routes.editor_dialog.type.label')}
                            options={[{ value: '1', label: 'Email' }]}
                            defaultValue={{ value: '1', label: 'Email' }}
                            isClearable={false}
                            isDisabled={true}
                            menuPosition="fixed"
                            translate={translate}
                        />
                    </div>
                    <hr />
                    <div className="settings-item-with-label">
                        <label className="required">{translate('admin.inbound.inbound_routes.editor_dialog.email.title')}</label>
                        <input
                            className="editable_textfield"
                            value={email}
                            disabled={mode === MODE.EDIT}
                            type="email"
                            placeholder={translate('admin.inbound.inbound_routes.editor_dialog.email.label')}
                            onChange={(evt: ChangeEvent<HTMLInputElement> & FormEvent) => {
                                setEmail(evt.target.value);
                                setErrors({ email: '' });
                            }}
                            onBlur={handleEmailValidation}
                        />
                        {!!errors['email'] && <div className="error-info">{errors['email']}</div>}
                    </div>
                    <div className="settings-item-with-label">
                        <label className="required">
                            {translate('admin.inbound.inbound_routes.editor_dialog.select_omni_queue.title')}
                        </label>
                        <AdvancedSelect
                            label={translate('admin.inbound.inbound_routes.editor_dialog.select_omni_queue.label')}
                            value={getValue(queues, selectedQueueId)}
                            onChange={(option: { label: string; value: string }) => setSelectedQueueId(parseInt(option.value))}
                            options={queues.map(({ id, name }) => ({ value: id, label: name }))}
                            isClearable={false}
                            isDisabled={false}
                            menuPosition="fixed"
                            translate={translate}
                        />
                        <div>{!!errors['queue'] && errors['queue']}</div>
                    </div>
                    <div className="settings-item-with-label">
                        <label className="required">{translate('admin.inbound.inbound_routes.editor_dialog.select_campaign.title')}</label>
                        <AdvancedSelect
                            label={translate('admin.inbound.inbound_routes.editor_dialog.select_campaign.label')}
                            value={getValue(campaigns, selectedCampaignId)}
                            onChange={(option: { label: string; value: string }) => setSelectedCampaignId(parseInt(option.value))}
                            options={campaigns.map(({ id, name }) => ({ value: id, label: name }))}
                            isClearable={false}
                            isDisabled={false}
                            menuPosition="fixed"
                            translate={translate}
                        />
                        <div>{!!errors['campaign'] && errors['campaign']}</div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog} disabled={false}>
                        {translate('generic.cancel.button')}
                    </Button>
                    <Button
                        raised
                        className="save"
                        onClick={saveInboundRoute}
                        disabled={!(email && selectedCampaignId && selectedQueueId && !errors.email)}
                    >
                        {translate('button_ok')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
