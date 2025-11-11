FROM grafana/grafana:latest

# Set as root user to copy files and set permissions
USER root

# Copy the built plugin directory to Grafana's plugins directory
COPY dist /var/lib/grafana/plugins/rapidata-rapidspreview-panel

# Set proper permissions
RUN chown -R grafana:grafana /var/lib/grafana/plugins/rapidata-rapidspreview-panel

# Allow the unsigned plugin to load
ENV GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=rapidata-rapidspreview-panel

# Switch back to grafana user
USER grafana
