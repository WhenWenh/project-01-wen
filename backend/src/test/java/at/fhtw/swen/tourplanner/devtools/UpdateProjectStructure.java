package at.fhtw.swen.tourplanner.devtools;

import java.io.*;
import java.util.logging.Level;
import java.util.logging.Logger;

public class UpdateProjectStructure {

    private static final Logger logger = Logger.getLogger(UpdateProjectStructure.class.getName());

    /**
     * Export project structure to ./doc/project_structure.txt using 'tree' command
     */
    public static void exportProjectStructure() {
        String projectRoot = new File("").getAbsolutePath();
        String outputFile = projectRoot + "/docs/project_structure.txt";

        String[] command = {
                "bash", "-c",
                "tree -a -I 'node_modules|.git|*.class|*.o|*.pyc|__pycache__|target|build' -L 12 | sed 's/\\xC2\\xA0/ /g' > docs/project_structure.txt"
        };

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(new File(projectRoot));
        pb.redirectErrorStream(true);

        try {
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {

                String line;
                while ((line = reader.readLine()) != null) {
                    // Replace non-breaking spaces with regular spaces
                    line = line.replace('\u00A0', ' ');
                    logger.info(line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                logger.info("Project structure exported to " + outputFile);
            } else {
                logger.warning("tree command failed with exit code " + exitCode);
            }
        } catch (IOException | InterruptedException e) {
            logger.log(Level.SEVERE, "Error exporting project structure", e);
            Thread.currentThread().interrupt();
        }
    }

    public static void update() {
        exportProjectStructure();
    }

    static void main() {
        update();
    }
}