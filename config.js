/**
 * Mères Form System - Configuration
 * Define your forms and fields here.
 */

const FORMS_CONFIG = {
    partner: {
        title: "Formulário de Parceiros",
        subtitle: "Seja um parceiro oficial da Mères. Preencha os dados abaixo para prosseguirmos com a sua solicitação.",
        infoText: "Após enviar os dados do formulário, você receberá em seu e-mail o contrato de parceiro.",
        fields: [
            { id: "nome", label: "Nome", type: "text", placeholder: "Sua Resposta", required: true, halfWidth: false },
            { id: "numero", label: "Número", type: "tel", placeholder: "Sua Resposta", required: true, halfWidth: true, mask: "phone" },
            { id: "cpf", label: "CPF", type: "text", placeholder: "000.000.000-00", required: true, halfWidth: true, mask: "cpf" },
            { id: "cnpj", label: "CNPJ (Opcional)", type: "text", placeholder: "Preencha este campo apenas se", required: false, halfWidth: true, mask: "cnpj" },
            { id: "chavePix", label: "Chave Pix", type: "text", placeholder: "Sua Resposta", required: true, halfWidth: true },
            { id: "seguimento", label: "Seguimento", type: "text", placeholder: "Sua Resposta", required: true, halfWidth: true },
            { id: "email", label: "E-mail", type: "email", placeholder: "Sua Resposta", required: true, halfWidth: true },
            { id: "escritorio", label: "Escritório (Opcional)", type: "text", placeholder: "Sua Resposta", required: false, halfWidth: false }
        ]
    },
    indicacao: {
        title: "Formulário de Indicação",
        subtitle: "Preencha os dados abaixo com atenção para realizar a indicação do seu cliente.",
        infoText: "Lembre-se de solicitar ao seu cliente que assine o contrato assim que receber o e-mail com o mesmo.",
        fields: [
            { id: "idParceiro", label: "Sua ID de Parceiro", type: "text", placeholder: "Sua Resposta", required: true, hint: "(Enviada no E-mail de confirmação de Parceria)" },
            { id: "nomeCliente", label: "Nome do Cliente", type: "text", placeholder: "Sua Resposta", required: true },
            { id: "cpfCliente", label: "CPF do Cliente", type: "text", placeholder: "000.000.000-00", required: true, halfWidth: true, mask: "cpf" },
            { id: "emailCliente", label: "E-mail do Cliente", type: "email", placeholder: "Sua Resposta", required: true, halfWidth: true }
        ]
    }
};

// Export for renderer
if (typeof module !== 'undefined') module.exports = FORMS_CONFIG;
