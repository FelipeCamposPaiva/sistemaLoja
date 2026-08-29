package com.temdetudo.erp.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de API contra o MySQL real (temdetudo_db). Sem H2.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MysqlApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void loginComCredenciaisValidasRetornaToken() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("admin", "123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.usuario").value("admin"));
    }

    @Test
    void loginComSenhaInvalidaNaoAutentica() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("admin_inexistente_it", "senha-errada")))
                .andReturn();

        int status = result.getResponse().getStatus();
        String body = result.getResponse().getContentAsString();

        assertThat(status).isNotEqualTo(200);
        assertThat(body == null || !body.contains("\"token\"")).isTrue();
    }

    @Test
    void meAutenticadoRetornaUsuarioLogado() throws Exception {
        String token = autenticarAdmin();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario").value("admin"));
    }

    @Test
    void getProdutosSemTokenENegado() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/produtos")).andReturn();
        int status = result.getResponse().getStatus();

        assertThat(status).isIn(401, 403);
    }

    @Test
    void getProdutosAutenticadoRetornaLista() throws Exception {
        String token = autenticarAdmin();

        mockMvc.perform(get("/api/produtos")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void crudCategoriaNoMysql() throws Exception {
        String token = autenticarAdmin();
        String nome = "IT-CAT-" + UUID.randomUUID();
        Long id = null;

        try {
            ObjectNode criar = objectMapper.createObjectNode();
            criar.put("nome", nome);
            criar.put("descricao", "categoria criada pelo teste de API");
            criar.put("ativo", true);

            MvcResult criado = mockMvc.perform(post("/api/categorias")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(criar)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").isNumber())
                    .andExpect(jsonPath("$.nome").value(nome))
                    .andReturn();

            id = objectMapper.readTree(criado.getResponse().getContentAsString())
                    .get("id")
                    .asLong();

            mockMvc.perform(get("/api/categorias/{id}", id)
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nome").value(nome));

            String nomeAtualizado = nome + "-UPD";
            ObjectNode atualizar = objectMapper.createObjectNode();
            atualizar.put("nome", nomeAtualizado);
            atualizar.put("descricao", "atualizada pelo teste");
            atualizar.put("ativo", true);

            mockMvc.perform(put("/api/categorias/{id}", id)
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(atualizar)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nome").value(nomeAtualizado));

            mockMvc.perform(get("/api/categorias")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        } finally {
            if (id != null) {
                mockMvc.perform(delete("/api/categorias/{id}", id)
                                .header("Authorization", "Bearer " + token))
                        .andExpect(status().isOk());
            }
        }
    }

    private String autenticarAdmin() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("admin", "123456")))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = body.path("token").asText();
        assertThat(token).isNotBlank();
        return token;
    }

    private String loginJson(String login, String senha) throws Exception {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("login", login);
        node.put("senha", senha);
        return objectMapper.writeValueAsString(node);
    }
}
