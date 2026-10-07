package com.temdetudo.erp;

import com.temdetudo.erp.desktop.PrepararBanco;
import com.temdetudo.erp.desktop.PrepararBanco.Conexao;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.event.ApplicationFailedEvent;
import org.springframework.boot.context.event.ApplicationReadyEvent;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.WindowConstants;

import java.awt.BorderLayout;
import java.awt.Desktop;
import java.awt.FlowLayout;
import java.awt.GraphicsEnvironment;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.net.URI;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Ponto de entrada do JAR. No desenvolvimento só sobe o Spring.
 * No executável (erp.home definido pelo jpackage) pede o MySQL na primeira vez,
 * grava config/local.properties e abre o navegador.
 */
public class DesktopLauncher {

    public static void main(String[] args) {
        boolean desktop = System.getProperty("erp.home") != null;
        if (desktop) {
            try {
                preparar(temArgumento(args, "--configurar"));
            } catch (Exception ex) {
                falha(ex);
                System.exit(1);
            }
        }

        SpringApplication app = new SpringApplication(ErpApplication.class);
        if (desktop) {
            app.addListeners((ApplicationReadyEvent event) -> abrirNavegador(event));
            app.addListeners((ApplicationFailedEvent event) -> falha(event.getException()));
        }
        app.run(args);
    }

    private static void preparar(boolean reconfigurar) throws IOException {
        Path home = resolverHome(System.getProperty("erp.home"));
        System.setProperty("erp.home", home.toString());
        System.setProperty("user.dir", home.toString());
        Files.createDirectories(home.resolve("uploads"));
        Files.createDirectories(home.resolve("config"));
        System.setProperty("erp.uploads.dir", home.resolve("uploads").toString());

        Path arquivo = home.resolve("config").resolve("local.properties");
        Properties props = ler(arquivo);
        if (reconfigurar || !completo(props)) {
            if (GraphicsEnvironment.isHeadless()) {
                throw new IllegalStateException(
                        "Crie o arquivo config\\local.properties ao lado do executável "
                                + "(DB_USERNAME, DB_PASSWORD e JWT_SECRET)."
                );
            }
            props = perguntar(home, props);
            gravar(arquivo, props);
        }
        System.out.println("ERP Tem de Tudo");
        System.out.println("Pasta: " + home);
        System.out.println("Feche esta janela para encerrar o sistema.");
    }

    private static Path resolverHome(String informado) {
        Path home = Path.of(informado).toAbsolutePath().normalize();
        if (home.getFileName() != null
                && "app".equalsIgnoreCase(home.getFileName().toString())
                && home.getParent() != null
                && Files.isDirectory(home.getParent().resolve("runtime"))) {
            return home.getParent();
        }
        return home;
    }

    private static Properties perguntar(Path home, Properties atual) {
        CountDownLatch pronto = new CountDownLatch(1);
        AtomicReference<Properties> saida = new AtomicReference<>();
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception ignored) {
                // visual padrão do Java
            }
            JFrame janela = new JFrame("ERP Tem de Tudo");
            janela.setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);

            JTextField servidor = new JTextField(valor(atual, "DB_HOST", "localhost"), 22);
            JTextField portaMysql = new JTextField(valor(atual, "DB_PORT", "3306"), 6);
            JTextField portaErp = new JTextField(valor(atual, "server.port", "8080"), 6);
            JTextField banco = new JTextField(valor(atual, "DB_NAME", "temdetudo_db"), 22);
            JTextField usuario = new JTextField(valor(atual, "DB_USERNAME", "root"), 22);
            JPasswordField senha = new JPasswordField(atual.getProperty("DB_PASSWORD", ""));
            JCheckBox criar = new JCheckBox("Criar o banco e as tabelas, se ainda não existirem", true);
            Path dump = home.resolve("banco").resolve("dados.sql");
            boolean temDump = Files.isRegularFile(dump);
            JCheckBox restaurar = new JCheckBox("Trazer os dados do computador anterior", temDump);
            restaurar.setEnabled(temDump);
            JLabel status = new JLabel(" ");

            JPanel campos = new JPanel(new GridBagLayout());
            campos.setBorder(BorderFactory.createEmptyBorder(12, 16, 8, 16));
            GridBagConstraints g = new GridBagConstraints();
            g.insets = new Insets(4, 4, 4, 4);
            g.anchor = GridBagConstraints.WEST;
            int linha = 0;
            adicionar(campos, g, linha++, new JLabel("MySQL deste computador. O servidor precisa estar instalado e em execução."));
            adicionar(campos, g, linha++, rotulo("Servidor", servidor));
            JPanel portas = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
            portas.add(new JLabel("Porta do MySQL"));
            portas.add(portaMysql);
            portas.add(new JLabel("Porta do ERP"));
            portas.add(portaErp);
            adicionar(campos, g, linha++, portas);
            adicionar(campos, g, linha++, rotulo("Banco", banco));
            adicionar(campos, g, linha++, rotulo("Usuário", usuario));
            adicionar(campos, g, linha++, rotulo("Senha", senha));
            adicionar(campos, g, linha++, criar);
            adicionar(campos, g, linha++, restaurar);
            adicionar(campos, g, linha, status);

            JButton iniciar = new JButton("Iniciar");
            JButton cancelar = new JButton("Cancelar");
            JPanel acoes = new JPanel(new FlowLayout(FlowLayout.RIGHT));
            acoes.add(iniciar);
            acoes.add(cancelar);

            janela.add(campos, BorderLayout.CENTER);
            janela.add(acoes, BorderLayout.SOUTH);
            janela.pack();
            janela.setLocationRelativeTo(null);
            janela.addWindowListener(new java.awt.event.WindowAdapter() {
                @Override
                public void windowClosed(java.awt.event.WindowEvent e) {
                    pronto.countDown();
                }
            });
            cancelar.addActionListener(e -> janela.dispose());
            iniciar.addActionListener(e -> {
                iniciar.setEnabled(false);
                status.setText("Conectando ao MySQL...");
                Conexao conexao;
                try {
                    conexao = new Conexao(
                            servidor.getText().trim(),
                            Integer.parseInt(portaMysql.getText().trim()),
                            banco.getText().trim(),
                            usuario.getText().trim(),
                            new String(senha.getPassword()),
                            Integer.parseInt(portaErp.getText().trim())
                    );
                    PrepararBanco.validar(conexao);
                } catch (RuntimeException ex) {
                    status.setText(ex.getMessage());
                    iniciar.setEnabled(true);
                    return;
                }
                boolean criarTabelas = criar.isSelected();
                boolean importar = restaurar.isSelected();
                new Thread(() -> {
                    try {
                        PrepararBanco.testar(conexao);
                        if (importar) {
                            SwingUtilities.invokeLater(() -> status.setText("Restaurando os dados..."));
                            PrepararBanco.importarDump(conexao, dump);
                        } else if (criarTabelas) {
                            SwingUtilities.invokeLater(() -> status.setText("Criando as tabelas..."));
                            PrepararBanco.criarEstrutura(conexao);
                        }
                        Properties gravado = new Properties();
                        gravado.setProperty("DB_HOST", conexao.host());
                        gravado.setProperty("DB_PORT", Integer.toString(conexao.portaMysql()));
                        gravado.setProperty("DB_NAME", conexao.banco());
                        gravado.setProperty("DB_USERNAME", conexao.usuario());
                        gravado.setProperty("DB_PASSWORD", conexao.senha() == null ? "" : conexao.senha());
                        gravado.setProperty("JWT_SECRET", segredo(atual));
                        gravado.setProperty("spring.datasource.url", conexao.urlAplicacao());
                        gravado.setProperty("server.port", Integer.toString(conexao.portaErp()));
                        gravado.setProperty("spring.jpa.show-sql", "false");
                        saida.set(gravado);
                        SwingUtilities.invokeLater(janela::dispose);
                    } catch (Exception ex) {
                        SwingUtilities.invokeLater(() -> {
                            status.setText(mensagem(ex));
                            iniciar.setEnabled(true);
                        });
                    }
                }, "erp-preparar-banco").start();
            });
            janela.getRootPane().setDefaultButton(iniciar);
            janela.setVisible(true);
        });
        try {
            pronto.await();
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            System.exit(1);
        }
        if (saida.get() == null) {
            System.exit(0);
        }
        return saida.get();
    }

    private static void abrirNavegador(ApplicationReadyEvent event) {
        if (!"true".equalsIgnoreCase(System.getProperty("erp.abrir-navegador"))) {
            return;
        }
        String porta = event.getApplicationContext().getEnvironment().getProperty("server.port", "8080");
        URI uri = URI.create("http://127.0.0.1:" + porta + "/");
        System.out.println("Sistema em " + uri);
        try {
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().browse(uri);
            }
        } catch (Exception ex) {
            System.out.println("Abra o navegador em " + uri);
        }
    }

    private static void falha(Throwable erro) {
        String texto = mensagem(erro);
        System.err.println(texto);
        if (GraphicsEnvironment.isHeadless()) {
            return;
        }
        SwingUtilities.invokeLater(() ->
                JOptionPane.showMessageDialog(null, texto, "ERP Tem de Tudo", JOptionPane.ERROR_MESSAGE)
        );
    }

    private static String mensagem(Throwable erro) {
        Throwable causa = erro;
        while (causa.getCause() != null && causa.getCause() != causa) {
            causa = causa.getCause();
        }
        String texto = causa.getMessage();
        if (texto == null || texto.isBlank()) {
            texto = erro.toString();
        }
        if (texto.length() > 500) {
            return texto.substring(0, 500) + "...";
        }
        return texto;
    }

    private static String segredo(Properties atual) {
        String existente = atual.getProperty("JWT_SECRET");
        if (existente != null && !existente.isBlank()) {
            return existente;
        }
        byte[] bytes = new byte[48];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static boolean completo(Properties props) {
        return valor(props, "DB_USERNAME", "").length() > 0
                && props.getProperty("DB_PASSWORD") != null
                && valor(props, "JWT_SECRET", "").length() > 0
                && valor(props, "spring.datasource.url", "").length() > 0;
    }

    private static String valor(Properties props, String chave, String padrao) {
        String valor = props.getProperty(chave);
        if (valor == null || valor.isBlank()) {
            return padrao;
        }
        return valor.trim();
    }

    private static Properties ler(Path arquivo) throws IOException {
        Properties props = new Properties();
        if (Files.isRegularFile(arquivo)) {
            try (InputStream in = Files.newInputStream(arquivo)) {
                props.load(in);
            }
        }
        return props;
    }

    private static void gravar(Path arquivo, Properties props) throws IOException {
        try (OutputStream out = Files.newOutputStream(arquivo)) {
            props.store(out, "ERP Tem de Tudo");
        }
    }

    private static boolean temArgumento(String[] args, String esperado) {
        if (args == null) {
            return false;
        }
        for (String arg : args) {
            if (esperado.equals(arg)) {
                return true;
            }
        }
        return false;
    }

    private static JPanel rotulo(String titulo, java.awt.Component campo) {
        JPanel painel = new JPanel(new BorderLayout(8, 0));
        JLabel label = new JLabel(titulo);
        label.setPreferredSize(new java.awt.Dimension(110, 24));
        painel.add(label, BorderLayout.WEST);
        painel.add(campo, BorderLayout.CENTER);
        return painel;
    }

    private static void adicionar(JPanel painel, GridBagConstraints g, int linha, java.awt.Component componente) {
        g.gridx = 0;
        g.gridy = linha;
        g.gridwidth = 2;
        g.fill = GridBagConstraints.HORIZONTAL;
        painel.add(componente, g);
    }
}
